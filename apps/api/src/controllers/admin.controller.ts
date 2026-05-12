import { Request, Response } from "express";

import { CommentModel } from "../models/Comment.model.js";
import { CollectionModel } from "../models/Collection.model.js";
import { NotificationModel } from "../models/Notification.model.js";
import { PhotoModel } from "../models/Photo.model.js";
import { ReportModel } from "../models/Report.model.js";
import { UserModel } from "../models/User.model.js";
import { listAdminReports, updateAdminReport } from "./report.controller.js";
import { sendError } from "../utils/http.js";

const ADMIN_LIST_LIMIT = 50;

export async function getAdminOverview(_request: Request, response: Response) {
  const [usersCount, photosCount, commentsCount, privatePhotosCount, popularPhotosCount, adminsCount, reportsCount] =
    await Promise.all([
      UserModel.countDocuments(),
      PhotoModel.countDocuments(),
      CommentModel.countDocuments(),
      PhotoModel.countDocuments({ isPrivate: true }),
      PhotoModel.countDocuments({ isPopular: true }),
      UserModel.countDocuments({ role: "ADMIN" }),
      ReportModel.countDocuments({ status: "OPEN" })
    ]);

  return response.json({
    stats: {
      usersCount,
      photosCount,
      commentsCount,
      privatePhotosCount,
      popularPhotosCount,
      adminsCount,
      reportsCount
    }
  });
}

export async function listAdminUsers(request: Request, response: Response) {
  const page = Math.max(1, Number(request.query.page ?? 1));
  const search = String(request.query.search ?? "").trim();
  const query = search
    ? {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { displayName: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const [items, total] = await Promise.all([
    UserModel.find(query)
      .select("-password -refreshToken -resetPasswordToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * ADMIN_LIST_LIMIT)
      .limit(ADMIN_LIST_LIMIT),
    UserModel.countDocuments(query)
  ]);

  return response.json({ items, page, limit: ADMIN_LIST_LIMIT, total });
}

export async function updateAdminUserRole(request: Request, response: Response) {
  const role = String(request.body.role ?? "").toUpperCase();

  if (role !== "USER" && role !== "ADMIN") {
    return sendError(response, 400, "Role must be USER or ADMIN");
  }

  if (request.params.id === request.user?.id && role !== "ADMIN") {
    return sendError(response, 400, "You cannot remove your own admin role");
  }

  const user = await UserModel.findByIdAndUpdate(
    request.params.id,
    { role },
    { new: true }
  ).select("-password -refreshToken -resetPasswordToken");

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  return response.json({ item: user });
}

export async function deleteAdminUser(request: Request, response: Response) {
  if (request.params.id === request.user?.id) {
    return sendError(response, 400, "You cannot delete your own account");
  }

  const user = await UserModel.findById(request.params.id);

  if (!user) {
    return sendError(response, 404, "User not found");
  }

  const photos = await PhotoModel.find({ author: user._id }).select("_id");
  const photoIds = photos.map((photo) => photo._id);

  await Promise.all([
    PhotoModel.deleteMany({ author: user._id }),
    CommentModel.deleteMany({ $or: [{ author: user._id }, { photo: { $in: photoIds } }] }),
    CollectionModel.deleteMany({ owner: user._id }),
    CollectionModel.updateMany({}, { $pull: { photos: { $in: photoIds } } }),
    NotificationModel.deleteMany({
      $or: [{ recipient: user._id }, { sender: user._id }, { photo: { $in: photoIds } }]
    }),
    ReportModel.deleteMany({ $or: [{ reporter: user._id }, { photo: { $in: photoIds } }] }),
    UserModel.updateMany(
      { _id: { $ne: user._id } },
      { $pull: { followers: user._id, following: user._id } }
    )
  ]);

  await user.deleteOne();

  const users = await UserModel.find().select("followers following");

  await Promise.all(
    users.map((item) => {
      item.followersCount = item.followers.length;
      item.followingCount = item.following.length;
      return item.save();
    })
  );

  return response.status(204).send();
}

export async function listAdminPhotos(request: Request, response: Response) {
  const page = Math.max(1, Number(request.query.page ?? 1));
  const search = String(request.query.search ?? "").trim();
  const category = String(request.query.category ?? "all").toUpperCase();
  const visibility = String(request.query.visibility ?? "all");
  const popularity = String(request.query.popularity ?? "all");
  const sort = String(request.query.sort ?? "newest");

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { caption: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } }
    ];
  }

  if (["NATURE", "PORTRAIT", "CITY", "ART", "FOOD", "OTHER"].includes(category)) {
    query.category = category;
  }

  if (visibility === "public") {
    query.isPrivate = { $ne: true };
  }

  if (visibility === "private") {
    query.isPrivate = true;
  }

  if (popularity === "popular") {
    query.isPopular = true;
  }

  if (popularity === "regular") {
    query.isPopular = { $ne: true };
  }

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    mostLiked: { likesCount: -1, createdAt: -1 },
    mostViewed: { views: -1, createdAt: -1 },
    mostCommented: { commentsCount: -1, createdAt: -1 }
  };

  const [items, total] = await Promise.all([
    PhotoModel.find(query)
      .populate("author", "username displayName avatarUrl")
      .sort(sortOptions[sort] ?? sortOptions.newest)
      .skip((page - 1) * ADMIN_LIST_LIMIT)
      .limit(ADMIN_LIST_LIMIT),
    PhotoModel.countDocuments(query)
  ]);

  return response.json({ items, page, limit: ADMIN_LIST_LIMIT, total });
}

export async function updateAdminPhoto(request: Request, response: Response) {
  const updates: { isPrivate?: boolean; isPopular?: boolean } = {};

  if (typeof request.body.isPrivate === "boolean") {
    updates.isPrivate = request.body.isPrivate;
  }

  if (typeof request.body.isPopular === "boolean") {
    updates.isPopular = request.body.isPopular;
  }

  const photo = await PhotoModel.findByIdAndUpdate(request.params.id, updates, { new: true })
    .populate("author", "username displayName avatarUrl");

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  return response.json({ item: photo });
}

export async function deleteAdminPhoto(request: Request, response: Response) {
  const photo = await PhotoModel.findById(request.params.id);

  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  await Promise.all([
    photo.deleteOne(),
    CommentModel.deleteMany({ photo: photo._id }),
    CollectionModel.updateMany({}, { $pull: { photos: photo._id } }),
    NotificationModel.deleteMany({ photo: photo._id }),
    ReportModel.deleteMany({ photo: photo._id }),
    UserModel.findByIdAndUpdate(photo.author, { $inc: { postsCount: -1 } })
  ]);

  return response.status(204).send();
}

export { listAdminReports, updateAdminReport };
