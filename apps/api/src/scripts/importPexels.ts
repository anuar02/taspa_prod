import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { PhotoModel } from "../models/Photo.model.js";
import { UserModel } from "../models/User.model.js";
import {
  curatedPexelsPhotos,
  mapPexelsCategory,
  searchPexelsPhotos,
  type PexelsPhoto
} from "../services/pexels.service.js";

const queries = [
  "nature landscape",
  "city night",
  "portrait woman",
  "portrait man",
  "minimal art",
  "food styling"
];

function uniqueById(photos: PexelsPhoto[]) {
  const seen = new Set<number>();

  return photos.filter((photo) => {
    if (seen.has(photo.id)) {
      return false;
    }

    seen.add(photo.id);
    return true;
  });
}

async function ensureImportUser() {
  const email = "pexels.importer@taspa.local";
  const existing = await UserModel.findOne({ email });

  if (existing) {
    return existing;
  }

  const password = await bcrypt.hash("password123", 10);

  return UserModel.create({
    username: "pexels_gallery",
    email,
    password,
    displayName: "Pexels Gallery",
    bio: "Imported demo gallery from Pexels.",
    avatarUrl: "",
    postsCount: 0
  });
}

async function run() {
  await connectDatabase();

  const importUser = await ensureImportUser();
  const searchResults = await Promise.all(queries.map((query) => searchPexelsPhotos(query, 8, 1)));
  const curated = await curatedPexelsPhotos(12, 1);

  const photosWithQuery = searchResults.flatMap((result, index) =>
    result.photos.map((photo) => ({
      photo,
      query: queries[index]
    }))
  );

  const curatedWithQuery = curated.photos.map((photo) => ({
    photo,
    query: "curated"
  }));

  const sourceMap = [...photosWithQuery, ...curatedWithQuery];
  const merged = uniqueById(sourceMap.map((item) => item.photo)).map((photo) => {
    const source = sourceMap.find((item) => item.photo.id === photo.id);
    return { photo, query: source?.query ?? "curated" };
  });

  const docs = merged.slice(0, 24).map(({ photo, query }, index) => ({
    author: importUser._id,
    imageUrl: photo.src.large2x ?? photo.src.large ?? photo.src.original,
    thumbnailUrl: photo.src.medium ?? photo.src.small ?? photo.src.portrait ?? photo.src.tiny ?? photo.src.original,
    caption: photo.alt || `Pexels photo by ${photo.photographer}`,
    tags: [`#${query.replace(/\s+/g, "")}`, "#pexels", "#imported"],
    category: mapPexelsCategory(query),
    location: "Pexels",
    likesCount: Math.max(5, 30 - index),
    commentsCount: index % 5,
    views: 120 + index * 17,
    isPopular: index < 8
  }));

  await PhotoModel.deleteMany({ location: "Pexels", author: importUser._id });
  await PhotoModel.insertMany(docs);
  await UserModel.findByIdAndUpdate(importUser._id, { postsCount: docs.length });

  console.log(`Imported ${docs.length} photos from Pexels.`);
  console.log("Credit Pexels and photographers where visible in the UI.");

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Pexels import failed", error);
  await mongoose.disconnect();
  process.exit(1);
});
