import { Router } from "express";
import auth from "../middleware/auth.js";
import { isSuperAdmin } from "../middleware/roleGuard.js";
import {
  createAdmin,
  getAllAdmins,
  toggleAdminStatus,
  superAdminDashboard,
} from "../controllers/superadmin.controllers.js";

const superadminRouter = Router();
superadminRouter.use(auth, isSuperAdmin);

superadminRouter.get("/dashboard",                superAdminDashboard);
superadminRouter.post("/admins",                  createAdmin);
superadminRouter.get("/admins",                   getAllAdmins);
superadminRouter.patch("/admins/:adminId/toggle", toggleAdminStatus);

export default superadminRouter;
