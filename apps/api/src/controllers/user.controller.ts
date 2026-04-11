import { Request, Response } from "express";

import { NotificationModel } from "../models/Notification.model.js";
import { PhotoModel } from "../models/Photo.model.js";
import { UserModel } from "../models/User.model.js";
import { emitToUser } from "../services/socket.service.js";
import { sendError } from "../utils/http.js";

export async function getUserProfile(request: Request, response: Response) {
  const username = String(request.params.username).toLowerCase();
  const user = await UserModel.findOne({ username }).select(
    "-password -refreshToken"
  );

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  return response.json({ item: user });
}

export async function getUserPhotos(request: Request, response: Response) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 12);
  const username = String(request.params.username).toLowerCase();
  const user = await UserModel.findOne({ username });

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  const photos = await PhotoModel.find({ author: user.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return response.json({ items: photos, page, limit });
}

export async function toggleFollow(request: Request, response: Response) {
  const currentUser = await UserModel.findById(request.user?.id);
  const username = String(request.params.username).toLowerCase();
  const targetUser = await UserModel.findOne({ username });

  if (!currentUser || !targetUser) {
    return sendError(response, 404, "User not found");
  }

  const isFollowing = currentUser.following.some((id) => id.toString() === targetUser.id);

  currentUser.following = isFollowing
    ? currentUser.following.filter((id) => id.toString() !== targetUser.id)
    : [...currentUser.following, targetUser._id];
  currentUser.followingCount = currentUser.following.length;

  targetUser.followers = isFollowing
    ? targetUser.followers.filter((id) => id.toString() !== currentUser.id)
    : [...targetUser.followers, currentUser._id];
  targetUser.followersCount = targetUser.followers.length;

  await Promise.all([currentUser.save(), targetUser.save()]);

  if (!isFollowing) {
    const notification = await NotificationModel.create({
      recipient: targetUser.id,
      sender: currentUser.id,
      type: "FOLLOW"
    });

    emitToUser(targetUser.id, "notification", notification);
  }

  return response.json({ following: !isFollowing });
}

export async function userSuggestions(request: Request, response: Response) {
  const excludeIds = request.user?.id ? [request.user.id] : [];
  const users = await UserModel.find({ _id: { $nin: excludeIds } })
    .select("-password -refreshToken")
    .sort({ followersCount: -1 })
    .limit(8);

  return response.json({ items: users });
}
