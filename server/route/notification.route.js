import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  getNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/notification.controllers.js";

const notifRouter = Router();
notifRouter.use(auth);

notifRouter.get("/",                  getNotifications);
notifRouter.patch("/mark-all-read",   markAllRead);
notifRouter.patch("/:id/read",        markOneRead);

export default notifRouter;
