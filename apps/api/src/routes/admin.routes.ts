import { Router } from "express";

import {
  deleteAdminPhoto,
  deleteAdminUser,
  getAdminOverview,
  listAdminReports,
  listAdminPhotos,
  listAdminUsers,
  updateAdminPhoto,
  updateAdminReport,
  updateAdminUserRole
} from "../controllers/admin.controller.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get("/overview", getAdminOverview);
adminRouter.get("/users", listAdminUsers);
adminRouter.patch("/users/:id/role", updateAdminUserRole);
adminRouter.delete("/users/:id", deleteAdminUser);
adminRouter.get("/photos", listAdminPhotos);
adminRouter.patch("/photos/:id", updateAdminPhoto);
adminRouter.delete("/photos/:id", deleteAdminPhoto);
adminRouter.get("/reports", listAdminReports);
adminRouter.patch("/reports/:id", updateAdminReport);
