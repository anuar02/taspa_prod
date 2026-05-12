import { Request, Response } from "express";
import { Types } from "mongoose";

import { NotificationModel } from "../models/Notification.model.js";
import { PhotoCategory, PhotoModel } from "../models/Photo.model.js";
import { UserModel } from "../models/User.model.js";
import { CommentModel } from "../models/Comment.model.js";
import { emitToUser } from "../services/socket.service.js";
import { uploadImage } from "../services/cloudinary.service.js";
import { sendError } from "../utils/http.js";

const POPULAR_THRESHOLD = 20;

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function listPhotos(request: Request, response: Response) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 12);
  const tab = String(request.query.tab ?? "all");
  const userId = request.user?.id;

  const query: Record<string, unknown> = { isPrivate: { $ne: true } };

  if (tab === "popular") {
    query.isPopular = true;
  }

  if (tab === "following" && userId) {
    const user = await UserModel.findById(userId);
    query.author = { $in: user?.following ?? [] };
  }

  const photos = await PhotoModel.find(query)
    .populate("author", "username displayName avatarUrl")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return response.json({ items: photos, page, limit });
}

export async function getPhoto(request: Request, response: Response) {
  const photo = await PhotoModel.findByIdAndUpdate(
    request.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("author", "username displayName avatarUrl");

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  if (photo.isPrivate && photo.author._id.toString() !== request.user?.id) {
    return sendError(response, 403, "Forbidden");
  }

  return response.json({ item: photo });
}

export async function createPhoto(request: Request, response: Response) {
  if (!request.user?.id) {
    return sendError(response, 401, "Unauthorized");
  }

  if (!request.file) {
    return sendError(response, 400, "Image is required");
  }

  const upload = await uploadImage(request.file.buffer, "taspa/photos");
  const tags = toStringArray(request.body.tags);
  const category = String(request.body.category ?? "OTHER").toUpperCase() as PhotoCategory;
  const isPrivate = request.body.isPrivate === "true" || request.body.isPrivate === true;

  const photo = await PhotoModel.create({
    author: request.user.id,
    imageUrl: upload.imageUrl,
    thumbnailUrl: upload.thumbnailUrl,
    caption: String(request.body.caption ?? ""),
    tags,
    category,
    location: String(request.body.location ?? ""),
    isPrivate
  });

  await UserModel.findByIdAndUpdate(request.user.id, { $inc: { postsCount: 1 } });

  return response.status(201).json({ item: photo });
}

export async function updatePhoto(request: Request, response: Response) {
  const photo = await PhotoModel.findById(request.params.id);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  if (photo.author.toString() !== request.user?.id) {
    return sendError(response, 403, "Forbidden");
  }

  const updates: Partial<{
    caption: string;
    tags: string[];
    category: PhotoCategory;
    location: string;
    isPrivate: boolean;
  }> = {};

  if (request.body.caption !== undefined) {
    updates.caption = String(request.body.caption).trim();
  }

  if (request.body.tags !== undefined) {
    updates.tags = toStringArray(request.body.tags);
  }

  if (request.body.category !== undefined) {
    const category = String(request.body.category).toUpperCase();
    if (!["NATURE", "PORTRAIT", "CITY", "ART", "FOOD", "OTHER"].includes(category)) {
      return sendError(response, 400, "Invalid category");
    }
    updates.category = category as PhotoCategory;
  }

  if (request.body.location !== undefined) {
    updates.location = String(request.body.location).trim();
  }

  if (request.body.isPrivate !== undefined) {
    updates.isPrivate = request.body.isPrivate === true || request.body.isPrivate === "true";
  }

  const updatedPhoto = await PhotoModel.findByIdAndUpdate(photo._id, updates, { new: true })
    .populate("author", "username displayName avatarUrl");

  return response.json({ item: updatedPhoto });
}

export async function deletePhoto(request: Request, response: Response) {
  const photo = await PhotoModel.findById(request.params.id);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  if (photo.author.toString() !== request.user?.id) {
    return sendError(response, 403, "Forbidden");
  }

  await photo.deleteOne();
  await CommentModel.deleteMany({ photo: photo._id });
  await UserModel.findByIdAndUpdate(request.user.id, { $inc: { postsCount: -1 } });

  return response.status(204).send();
}

export async function toggleLike(request: Request, response: Response) {
  const userId = request.user?.id;

  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  const photo = await PhotoModel.findById(request.params.id);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  const objectUserId = new Types.ObjectId(userId);
  const alreadyLiked = photo.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    photo.likes = photo.likes.filter((id) => id.toString() !== userId);
    photo.likesCount = Math.max(0, photo.likesCount - 1);
  } else {
    photo.likes = [...photo.likes, objectUserId];
    photo.likesCount += 1;
  }

  photo.isPopular = photo.likesCount >= POPULAR_THRESHOLD;
  await photo.save();

  if (!alreadyLiked && photo.author.toString() !== userId) {
    await NotificationModel.create({
      recipient: photo.author,
      sender: userId,
      type: "LIKE",
      photo: photo.id
    });

    emitToUser(photo.author.toString(), "like_updated", {
      photoId: photo.id,
      likesCount: photo.likesCount
    });
  }

  return response.json({ liked: !alreadyLiked, likesCount: photo.likesCount });
}

export async function toggleSave(request: Request, response: Response) {
  const userId = request.user?.id;

  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  const photo = await PhotoModel.findById(request.params.id);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  const objectUserId = new Types.ObjectId(userId);
  const alreadySaved = photo.saves.some((id) => id.toString() === userId);

  photo.saves = alreadySaved
    ? photo.saves.filter((id) => id.toString() !== userId)
    : [...photo.saves, objectUserId];
  await photo.save();

  if (!alreadySaved && photo.author.toString() !== userId) {
    await NotificationModel.create({
      recipient: photo.author,
      sender: userId,
      type: "SAVE",
      photo: photo.id
    });
  }

  return response.json({ saved: !alreadySaved });
}

export async function savedPhotos(request: Request, response: Response) {
  const userId = request.user?.id;

  const photos = await PhotoModel.find({ saves: userId })
    .populate("author", "username displayName avatarUrl")
    .sort({ createdAt: -1 });

  return response.json({ items: photos });
}

export async function popularPhotos(_request: Request, response: Response) {
  const photos = await PhotoModel.find({ isPopular: true, isPrivate: { $ne: true } })
    .populate("author", "username displayName avatarUrl")
    .sort({ likesCount: -1, createdAt: -1 })
    .limit(24);

  return response.json({ items: photos });
}
