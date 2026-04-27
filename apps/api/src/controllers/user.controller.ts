import { Request, Response } from "express";

import { NotificationModel } from "../models/Notification.model.js";
import { PhotoModel } from "../models/Photo.model.js";
import { IUser, UserModel } from "../models/User.model.js";
import { uploadImage } from "../services/cloudinary.service.js";
import { emitToUser } from "../services/socket.service.js";
import { sendError } from "../utils/http.js";

function toPublicUser(user: Pick<
  IUser,
  "username" | "displayName" | "bio" | "avatarUrl" | "postsCount" | "followersCount" | "followingCount"
> & { _id: { toString(): string } }) {
  return {
    _id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    postsCount: user.postsCount,
    followersCount: user.followersCount,
    followingCount: user.followingCount
  };
}

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

async function listConnections(userIdList: IUser["followers"]) {
  if (userIdList.length === 0) {
    return [];
  }

  const users = await UserModel.find({ _id: { $in: userIdList } }).select(
    "username displayName bio avatarUrl postsCount followersCount followingCount"
  );
  const byId = new Map(users.map((user) => [user._id.toString(), toPublicUser(user)]));

  return userIdList
    .map((id) => byId.get(id.toString()))
    .filter((item): item is ReturnType<typeof toPublicUser> => Boolean(item));
}

export async function getFollowers(request: Request, response: Response) {
  const username = String(request.params.username).toLowerCase();
  const user = await UserModel.findOne({ username }).select("followers");

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  const items = await listConnections(user.followers);
  return response.json({ items });
}

export async function getFollowing(request: Request, response: Response) {
  const username = String(request.params.username).toLowerCase();
  const user = await UserModel.findOne({ username }).select("following");

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  const items = await listConnections(user.following);
  return response.json({ items });
}

export async function getUserPhotos(request: Request, response: Response) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 12);
  const username = String(request.params.username).toLowerCase();
  const user = await UserModel.findOne({ username });

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  const isOwner = request.user?.id === user.id;
  const query: Record<string, unknown> = { author: user.id };
  if (!isOwner) {
    query.isPrivate = { $ne: true };
  }

  const photos = await PhotoModel.find(query)
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

export async function uploadAvatar(request: Request, response: Response) {
  const userId = request.user?.id;
  if (!userId) return sendError(response, 401, "Unauthorized");

  const file = request.file;
  if (!file) return sendError(response, 400, "No image provided");

  const { thumbnailUrl } = await uploadImage(file.buffer, "taspa/avatars");

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { avatarUrl: thumbnailUrl },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) return sendError(response, 404, "User not found");

  return response.json({ item: user, avatarUrl: thumbnailUrl });
}

export async function updateMe(request: Request, response: Response) {
  const userId = request.user?.id;

  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  const { displayName, bio, avatarUrl } = request.body as {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  };

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      ...(displayName !== undefined ? { displayName: String(displayName).trim() } : {}),
      ...(bio !== undefined ? { bio: String(bio).trim() } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: String(avatarUrl).trim() } : {})
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  return response.json({ item: user });
}
