import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";

import { connectDatabase } from "../config/db.js";
import { env } from "../config/env.js";
import { PhotoModel } from "../models/Photo.model.js";
import { UserModel } from "../models/User.model.js";
import { searchMetImportPhotos } from "../services/met.service.js";
import {
  curatedPexelsPhotos,
  mapPexelsCategory,
  searchPexelsPhotos,
  type PexelsPhoto
} from "../services/pexels.service.js";
import { searchNasaImportPhotos } from "../services/nasa.service.js";
import { ImportedPhoto } from "../utils/photoImport.js";

const NASA_QUERIES = ["earth", "aurora", "nebula"];
const MET_QUERIES = ["portrait", "landscape", "still life"];
const PEXELS_QUERIES = [
  "nature landscape",
  "city night",
  "portrait woman",
  "portrait man",
  "minimal art",
  "food styling"
];

type ImportSource = {
  key: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  fetchPhotos: () => Promise<ImportedPhoto[]>;
};

function uniqueByExternalId(photos: ImportedPhoto[]) {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    if (seen.has(photo.externalId)) {
      return false;
    }

    seen.add(photo.externalId);
    return true;
  });
}

async function ensureImportUser(source: Pick<ImportSource, "email" | "username" | "displayName" | "bio">) {
  const existing = await UserModel.findOne({ email: source.email });

  if (existing) {
    return existing;
  }

  const password = await bcrypt.hash("password123", 10);

  return UserModel.create({
    username: source.username,
    email: source.email,
    password,
    displayName: source.displayName,
    bio: source.bio,
    avatarUrl: "",
    postsCount: 0
  });
}

async function fetchNasaPhotos() {
  const results = await Promise.all(NASA_QUERIES.map((query) => searchNasaImportPhotos(query, 6, 1)));
  return uniqueByExternalId(results.flat()).slice(0, 18);
}

async function fetchMetPhotos() {
  const results = await Promise.all(MET_QUERIES.map((query) => searchMetImportPhotos(query, 6)));
  return uniqueByExternalId(results.flat()).slice(0, 18);
}

function uniquePexelsById(photos: PexelsPhoto[]) {
  const seen = new Set<number>();

  return photos.filter((photo) => {
    if (seen.has(photo.id)) {
      return false;
    }

    seen.add(photo.id);
    return true;
  });
}

async function fetchPexelsPhotos() {
  if (!env.pexelsApiKey) {
    return [];
  }

  const searchResults = await Promise.all(PEXELS_QUERIES.map((query) => searchPexelsPhotos(query, 8, 1)));
  const curated = await curatedPexelsPhotos(12, 1);

  const photosWithQuery = searchResults.flatMap((result, index) =>
    result.photos.map((photo) => ({
      photo,
      query: PEXELS_QUERIES[index]
    }))
  );

  const curatedWithQuery = curated.photos.map((photo) => ({
    photo,
    query: "curated"
  }));

  const sourceMap = [...photosWithQuery, ...curatedWithQuery];

  return uniqueByExternalId(
    uniquePexelsById(sourceMap.map((item) => item.photo))
      .map((photo) => {
        const source = sourceMap.find((item) => item.photo.id === photo.id);
        const query = source?.query ?? "curated";

        return {
          externalId: `pexels:${photo.id}`,
          imageUrl: photo.src.large2x ?? photo.src.large ?? photo.src.original,
          thumbnailUrl:
            photo.src.medium ?? photo.src.small ?? photo.src.portrait ?? photo.src.tiny ?? photo.src.original,
          caption: photo.alt || `Pexels photo by ${photo.photographer}`,
          tags: [`#${query.replace(/\s+/g, "")}`, "#pexels", "#imported"],
          category: mapPexelsCategory(query),
          location: "Pexels"
        } satisfies ImportedPhoto;
      })
      .slice(0, 24)
  );
}

function buildDocs(authorId: Types.ObjectId, photos: ImportedPhoto[], startOffset = 0) {
  return photos.map((photo, index) => {
    const position = startOffset + index;

    return {
      author: authorId,
      imageUrl: photo.imageUrl,
      thumbnailUrl: photo.thumbnailUrl,
      caption: photo.caption,
      tags: photo.tags,
      category: photo.category,
      location: photo.location,
      likesCount: Math.max(4, 34 - (position % 20)),
      commentsCount: position % 6,
      views: 140 + position * 21,
      isPopular: position % 5 === 0 || index < 3
    };
  });
}

async function run() {
  await connectDatabase();

  const sources: ImportSource[] = [
    {
      key: "nasa",
      email: "nasa.importer@taspa.local",
      username: "nasa_gallery",
      displayName: "NASA Gallery",
      bio: "Imported demo gallery from NASA public APIs.",
      fetchPhotos: fetchNasaPhotos
    },
    {
      key: "met",
      email: "met.importer@taspa.local",
      username: "met_gallery",
      displayName: "Met Collection",
      bio: "Imported demo gallery from The Met public collection API.",
      fetchPhotos: fetchMetPhotos
    }
  ];

  if (env.pexelsApiKey) {
    sources.push({
      key: "pexels",
      email: "pexels.importer@taspa.local",
      username: "pexels_gallery",
      displayName: "Pexels Gallery",
      bio: "Imported demo gallery from Pexels.",
      fetchPhotos: fetchPexelsPhotos
    });
  }

  const importedSources: Array<
    Pick<ImportSource, "key" | "email" | "username" | "displayName" | "bio"> & { photos: ImportedPhoto[] }
  > = [];

  for (const source of sources) {
    try {
      const photos = uniqueByExternalId(await source.fetchPhotos());

      if (!photos.length) {
        console.warn(`Skipped ${source.key}: no photos returned.`);
        continue;
      }

      importedSources.push({
        key: source.key,
        email: source.email,
        username: source.username,
        displayName: source.displayName,
        bio: source.bio,
        photos
      });
    } catch (error) {
      console.warn(`Skipped ${source.key}:`, error);
    }
  }

  if (!importedSources.length) {
    throw new Error("No photos were fetched from public APIs.");
  }

  const docsToInsert: Array<{
    author: Types.ObjectId;
    imageUrl: string;
    thumbnailUrl: string;
    caption: string;
    tags: string[];
    category: string;
    location: string;
    likesCount: number;
    commentsCount: number;
    views: number;
    isPopular: boolean;
  }> = [];

  let offset = 0;

  for (const source of importedSources) {
    const importUser = await ensureImportUser(source);
    await PhotoModel.deleteMany({ author: importUser._id });

    docsToInsert.push(...buildDocs(importUser._id, source.photos, offset));
    offset += source.photos.length;
  }

  await PhotoModel.insertMany(docsToInsert);

  await Promise.all(
    importedSources.map(async (source) => {
      const importUser = await UserModel.findOne({ email: source.email });

      if (!importUser) {
        return;
      }

      await UserModel.findByIdAndUpdate(importUser._id, { postsCount: source.photos.length });
    })
  );

  console.log(
    `Imported ${docsToInsert.length} photos from ${importedSources.map((source) => source.key).join(", ")}.`
  );

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Public API import failed", error);
  await mongoose.disconnect();
  process.exit(1);
});
