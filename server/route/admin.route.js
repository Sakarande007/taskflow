import { Router } from "express";
import auth from "../middleware/auth.js";
import { isAdmin } from "../middleware/roleGuard.js";
import {
  adminCreateUser,
  adminGetMyUsers,
  adminUpdateUser,
  adminDeactivateUser,
  adminDashboardStats,
} from "../controllers/admin.controllers.js";

const adminRouter = Router();
adminRouter.use(auth, isAdmin); // all routes require auth + admin role

adminRouter.get("/dashboard",             adminDashboardStats);
adminRouter.post("/users",                adminCreateUser);
adminRouter.get("/users",                 adminGetMyUsers);
adminRouter.put("/users/:userId",         adminUpdateUser);
adminRouter.patch("/users/:userId/deactivate", adminDeactivateUser);

export default adminRouter;
