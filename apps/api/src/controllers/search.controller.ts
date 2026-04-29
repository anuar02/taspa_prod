import { Request, Response } from "express";

import { PhotoModel } from "../models/Photo.model.js";
import {
  curatedPexelsPhotos,
  searchPexelsPhotos,
  type PexelsPhoto
} from "../services/pexels.service.js";
import { UserModel } from "../models/User.model.js";

const categoryPreview = [
  { key: "NATURE", label: "Табиғат" },
  { key: "PORTRAIT", label: "Портрет" },
  { key: "CITY", label: "Қала" },
  { key: "ART", label: "Өнер" },
  { key: "FOOD", label: "Тағам" },
  { key: "OTHER", label: "Басқа" }
];

const splashQueries = [
  "nature landscape",
  "city night",
  "portrait editorial",
  "minimal art"
];

function resolveCategoryQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  const match = categoryPreview.find(
    (item) => item.key.toLowerCase() === normalized || item.label.toLowerCase() === normalized
  );
  return match?.key;
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

export async function search(request: Request, response: Response) {
  const q = String(request.query.q ?? "").trim();
  const type = String(request.query.type ?? "photo");
  const page = Number(request.query.page ?? 1);
  const limit = 12;

  if (!q) {
    return response.json({ items: [] });
  }

  if (type === "user") {
    const users = await UserModel.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { displayName: { $regex: q, $options: "i" } }
      ]
    })
      .select("-password -refreshToken")
      .skip((page - 1) * limit)
      .limit(limit);

    return response.json({ items: users });
  }

  if (type === "tag") {
    const photos = await PhotoModel.find({ tags: { $regex: q, $options: "i" } })
      .populate("author", "username displayName avatarUrl")
      .skip((page - 1) * limit)
      .limit(limit);

    return response.json({ items: photos });
  }

  const categoryKey = resolveCategoryQuery(q);
  const photoFilters: Array<Record<string, unknown>> = [
    { caption: { $regex: q, $options: "i" } },
    { location: { $regex: q, $options: "i" } },
    { tags: { $regex: q, $options: "i" } }
  ];

  if (categoryKey) {
    photoFilters.push({ category: categoryKey });
  }

  const photos = await PhotoModel.find({ $or: photoFilters })
    .populate("author", "username displayName avatarUrl")
    .skip((page - 1) * limit)
    .limit(limit);

  return response.json({ items: photos });
}

export async function splash(_request: Request, response: Response) {
  try {
    const searchResults = await Promise.all(
      splashQueries.map((query) => searchPexelsPhotos(query, 4, 1))
    );
    const curated = await curatedPexelsPhotos(8, 1);

    const items = uniquePexelsById([
      ...searchResults.flatMap((result) => result.photos),
      ...curated.photos
    ])
      .slice(0, 12)
      .map((photo) => ({
        id: String(photo.id),
        imageUrl:
          photo.src.medium ??
          photo.src.large ??
          photo.src.portrait ??
          photo.src.small ??
          photo.src.original,
        alt: photo.alt?.trim() || `Photo by ${photo.photographer}`,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url
      }));

    return response.json({ items });
  } catch (error) {
    console.error("Splash photo fetch failed", error);
    return response.json({ items: [] });
  }
}

export async function categories(_request: Request, response: Response) {
  const categories = await Promise.all(
    categoryPreview.map(async (category) => {
      const preview = await PhotoModel.findOne({ category: category.key }).sort({ likesCount: -1 });

      return {
        ...category,
        previewUrl: preview?.thumbnailUrl ?? ""
      };
    })
  );

  return response.json({ items: categories });
}

export async function trending(_request: Request, response: Response) {
  const aggregation = await PhotoModel.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return response.json({
    items: aggregation.map((item) => ({
      tag: item._id,
      count: item.count
    }))
  });
}
