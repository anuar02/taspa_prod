import { Request, Response } from "express";

import { PhotoModel } from "../models/Photo.model.js";
import { ReportModel, ReportStatus } from "../models/Report.model.js";
import { sendError } from "../utils/http.js";

export async function createPhotoReport(request: Request, response: Response) {
  const userId = request.user?.id;
  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  const reason = String(request.body.reason ?? "").trim();
  if (!reason) {
    return sendError(response, 400, "Reason is required");
  }

  const photo = await PhotoModel.findById(request.params.photoId);
  if (!photo) {
    return sendError(response, 404, "Photo not found");
  }

  if (photo.author.toString() === userId) {
    return sendError(response, 400, "You cannot report your own photo");
  }

  const item = await ReportModel.findOneAndUpdate(
    { photo: photo._id, reporter: userId },
    { reason, status: "OPEN" },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return response.status(201).json({ item });
}

export async function listAdminReports(request: Request, response: Response) {
  const status = String(request.query.status ?? "OPEN").toUpperCase();
  const query = status === "ALL" ? {} : { status };

  const items = await ReportModel.find(query)
    .populate("reporter", "username displayName avatarUrl")
    .populate({
      path: "photo",
      populate: { path: "author", select: "username displayName avatarUrl" }
    })
    .sort({ createdAt: -1 })
    .limit(100);

  return response.json({ items });
}

export async function updateAdminReport(request: Request, response: Response) {
  const status = String(request.body.status ?? "").toUpperCase() as ReportStatus;

  if (!["OPEN", "REVIEWED", "DISMISSED"].includes(status)) {
    return sendError(response, 400, "Invalid report status");
  }

  const item = await ReportModel.findByIdAndUpdate(
    request.params.id,
    { status },
    { new: true }
  )
    .populate("reporter", "username displayName avatarUrl")
    .populate({
      path: "photo",
      populate: { path: "author", select: "username displayName avatarUrl" }
    });

  if (!item) {
    return sendError(response, 404, "Report not found");
  }

  return response.json({ item });
}
