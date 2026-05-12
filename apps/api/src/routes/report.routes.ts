import { Router } from "express";

import { createPhotoReport } from "../controllers/report.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const reportRouter = Router();

reportRouter.post("/photos/:photoId", authMiddleware, createPhotoReport);
