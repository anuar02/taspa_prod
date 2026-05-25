import { Router } from "express";

import { suggestPhotoMetadata } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";

export const aiRouter = Router();

aiRouter.post("/photo-suggestions", authMiddleware, uploadMiddleware.single("image"), suggestPhotoMetadata);
