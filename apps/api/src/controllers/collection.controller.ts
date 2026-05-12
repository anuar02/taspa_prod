import { Request, Response } from "express";
import { Types } from "mongoose";

import { CollectionModel } from "../models/Collection.model.js";
import { PhotoModel } from "../models/Photo.model.js";
import { sendError } from "../utils/http.js";

function requireUserId(request: Request, response: Response) {
  const userId = request.user?.id;
  if (!userId) {
    sendError(response, 401, "Unauthorized");
    return null;
  }

  return userId;
}

export async function listCollections(request: Request, response: Response) {
  const userId = requireUserId(request, response);
  if (!userId) return;

  const items = await CollectionModel.find({ owner: userId })
    .populate("photos", "thumbnailUrl imageUrl caption author category location")
    .sort({ updatedAt: -1 });

  return response.json({ items });
}

export async function getCollection(request: Request, response: Response) {
  const userId = requireUserId(request, response);
  if (!userId) return;

  const item = await CollectionModel.findOne({ _id: request.params.id, owner: userId })
    .populate({
      path: "photos",
      populate: { path: "author", select: "username displayName avatarUrl" }
    });

  if (!item) {
    return sendError(response, 404, "Collection not found");
  }

  return response.json({ item });
}

export async function createCollection(request: Request, response: Response) {
  const userId = requireUserId(request, response);
  if (!userId) return;

  const title = String(request.body.title ?? "").trim();

  if (!title) {
    return sendError(response, 400, "Title is required");
  }

  const item = await CollectionModel.create({
    owner: userId,
    title,
    description: String(request.body.description ?? "").trim()
  });

  return response.status(201).json({ item });
}

export async function deleteCollection(request: Request, response: Response) {
  const userId = requireUserId(request, response);
  if (!userId) return;

  const item = await CollectionModel.findOneAndDelete({ _id: request.params.id, owner: userId });

  if (!item) {
    return sendError(response, 404, "Collection not found");
  }

  return response.status(204).send();
}

export async function addPhotoToCollection(request: Request, response: Response) {
  const userId = requireUserId(request, response);
  if (!userId) return;

  const photo = await PhotoModel.findById(request.body.photoId);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  const isOwner = photo.author.toString() === userId;
  if (photo.isPrivate && !isOwner) {
    return sendError(response, 403, "Forbidden");
  }

  const item = await CollectionModel.findOneAndUpdate(
    { _id: request.params.id, owner: userId },
    { $addToSet: { photos: new Types.ObjectId(photo.id) } },
    { new: true }
  );

  if (!item) {
    return sendError(response, 404, "Collection not found");
  }

  return response.json({ item });
}

export async function removePhotoFromCollection(request: Request, response: Response) {
  const userId = requireUserId(request, response);
  if (!userId) return;

  const item = await CollectionModel.findOneAndUpdate(
    { _id: request.params.id, owner: userId },
    { $pull: { photos: request.params.photoId } },
    { new: true }
  );

  if (!item) {
    return sendError(response, 404, "Collection not found");
  }

  return response.json({ item });
}
