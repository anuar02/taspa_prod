import { NextFunction, Request, Response } from "express";

import { UserModel } from "../models/User.model.js";
import { sendError } from "../utils/http.js";

export async function adminMiddleware(request: Request, response: Response, next: NextFunction) {
  const userId = request.user?.id;

  if (!userId) {
    return sendError(response, 401, "Unauthorized");
  }

  const user = await UserModel.findById(userId).select("role");

  if (!user || user.role !== "ADMIN") {
    return sendError(response, 403, "Admin access required");
  }

  next();
}
