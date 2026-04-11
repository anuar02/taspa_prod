import { Request, Response } from "express";
import { Types } from "mongoose";

import { CommentModel } from "../models/Comment.model.js";
import { NotificationModel } from "../models/Notification.model.js";
import { PhotoModel } from "../models/Photo.model.js";
import { emitToUser } from "../services/socket.service.js";
import { sendError } from "../utils/http.js";

export async function listComments(request: Request, response: Response) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);

  const comments = await CommentModel.find({ photo: request.params.photoId })
    .populate("author", "username displayName avatarUrl")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return response.json({ items: comments, page, limit });
}

export async function createComment(request: Request, response: Response) {
  const userId = request.user?.id;

  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  if (!request.body.text) {
    return sendError(response, 400, "Text is required");
  }

  const photo = await PhotoModel.findById(request.params.photoId);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  const comment = await CommentModel.create({
    photo: request.params.photoId,
    author: userId,
    text: request.body.text,
    parentComment: request.body.parentComment ?? null
  });

  await PhotoModel.findByIdAndUpdate(request.params.photoId, { $inc: { commentsCount: 1 } });

  if (photo.author.toString() !== userId) {
    const notification = await NotificationModel.create({
      recipient: photo.author,
      sender: userId,
      type: "COMMENT",
      photo: photo.id
    });

    emitToUser(photo.author.toString(), "notification", notification);
  }

  const populated = await comment.populate("author", "username displayName avatarUrl");

  return response.status(201).json({ item: populated });
}

export async function deleteComment(request: Request, response: Response) {
  const comment = await CommentModel.findById(request.params.commentId);

  if (!comment) {
    return sendError(response, 404, "Comment not found");
  }

  if (comment.author.toString() !== request.user?.id) {
    return sendError(response, 403, "Forbidden");
  }

  await comment.deleteOne();
  await PhotoModel.findByIdAndUpdate(comment.photo, { $inc: { commentsCount: -1 } });

  return response.status(204).send();
}

export async function toggleCommentLike(request: Request, response: Response) {
  const userId = request.user?.id;

  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  const comment = await CommentModel.findById(request.params.commentId);

  if (!comment) {
    return sendError(response, 404, "Comment not found");
  }

  const objectUserId = new Types.ObjectId(userId);
  const alreadyLiked = comment.likes.some((id) => id.toString() === userId);

  comment.likes = alreadyLiked
    ? comment.likes.filter((id) => id.toString() !== userId)
    : [...comment.likes, objectUserId];
  await comment.save();

  return response.json({ liked: !alreadyLiked, likesCount: comment.likes.length });
}
