import { NextFunction, Request, Response } from "express";

import { sendError } from "../utils/http.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return sendError(response, 401, "Unauthorized");
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyAccessToken(token);

    request.user = { id: payload.userId };
    next();
  } catch {
    return sendError(response, 401, "Invalid token");
  }
}
