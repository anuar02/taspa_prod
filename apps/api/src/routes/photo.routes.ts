import { Router } from "express";

import {
  createPhoto,
  deletePhoto,
  getPhoto,
  listPhotos,
  popularPhotos,
  savedPhotos,
  toggleLike,
  toggleSave
} from "../controllers/photo.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";

export const photoRouter = Router();

photoRouter.get("/", listPhotos);
photoRouter.get("/saved", authMiddleware, savedPhotos);
photoRouter.get("/popular", popularPhotos);
photoRouter.get("/:id", optionalAuthMiddleware, getPhoto);
photoRouter.post("/", authMiddleware, uploadMiddleware.single("image"), createPhoto);
photoRouter.delete("/:id", authMiddleware, deletePhoto);
photoRouter.post("/:id/like", authMiddleware, toggleLike);
photoRouter.post("/:id/save", authMiddleware, toggleSave);
