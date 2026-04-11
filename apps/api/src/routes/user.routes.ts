import { Router } from "express";

import {
  getUserPhotos,
  getUserProfile,
  toggleFollow,
  updateMe,
  uploadAvatar,
  userSuggestions
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";

export const userRouter = Router();

userRouter.get("/suggestions", userSuggestions);
userRouter.post("/me/avatar", authMiddleware, uploadMiddleware.single("avatar"), uploadAvatar);
userRouter.patch("/me", authMiddleware, updateMe);
userRouter.get("/:username", getUserProfile);
userRouter.get("/:username/photos", getUserPhotos);
userRouter.post("/:username/follow", authMiddleware, toggleFollow);
