import { Router } from "express";

import {
  createComment,
  deleteComment,
  listComments,
  toggleCommentLike
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const commentRouter = Router();

commentRouter.get("/photo/:photoId", listComments);
commentRouter.post("/photo/:photoId", authMiddleware, createComment);
commentRouter.delete("/:commentId", authMiddleware, deleteComment);
commentRouter.post("/:commentId/like", authMiddleware, toggleCommentLike);
