import { Router } from "express";
import auth from "../middleware/auth.js";
import { isAdmin } from "../middleware/roleGuard.js";
import {
  createTask,
  adminGetAllTasks,
  adminGetTaskTimeline,
  adminUpdateTask,
  userGetMyTasks,
  userStartTask,
  userCompleteTask,
  userForwardTask,
  userGetTaskDetail,
} from "../controllers/task.controllers.js";

const taskRouter = Router();

// Admin endpoints
taskRouter.post("/",                   auth, isAdmin, createTask);
taskRouter.get("/admin/all",           auth, isAdmin, adminGetAllTasks);
taskRouter.get("/admin/:taskId",       auth, isAdmin, adminGetTaskTimeline);
taskRouter.put("/admin/:taskId",       auth, isAdmin, adminUpdateTask);

// User endpoints (any authenticated user)
taskRouter.get("/my",                  auth, userGetMyTasks);
taskRouter.get("/:taskId",             auth, userGetTaskDetail);
taskRouter.patch("/:taskId/start",     auth, userStartTask);
taskRouter.patch("/:taskId/complete",  auth, userCompleteTask);
taskRouter.post("/:taskId/forward",    auth, userForwardTask);

export default taskRouter;
