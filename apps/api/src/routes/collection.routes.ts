import { Router } from "express";

import {
  addPhotoToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removePhotoFromCollection
} from "../controllers/collection.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const collectionRouter = Router();

collectionRouter.use(authMiddleware);

collectionRouter.get("/", listCollections);
collectionRouter.post("/", createCollection);
collectionRouter.get("/:id", getCollection);
collectionRouter.delete("/:id", deleteCollection);
collectionRouter.post("/:id/photos", addPhotoToCollection);
collectionRouter.delete("/:id/photos/:photoId", removePhotoFromCollection);
