import { Router } from "express";

import {
  getUserPhotos,
  getUserProfile,
  toggleFollow,
  userSuggestions
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.get("/suggestions", userSuggestions);
userRouter.get("/:username", getUserProfile);
userRouter.get("/:username/photos", getUserPhotos);
userRouter.post("/:username/follow", authMiddleware, toggleFollow);
