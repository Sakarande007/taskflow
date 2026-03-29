import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/connectDB.js";
import userRouter from "./route/user.route.js";
import adminRouter from "./route/admin.route.js";
import taskRouter from "./route/task.route.js";
import superadminRouter from "./route/superadmin.route.js";
import notifRouter from "./route/notification.route.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
dotenv.config();

const app = express();
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174", // Added for cases where port 5173 is occupied
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin "${origin}" not allowed`));
      }
    },
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Global rate limit
app.use(apiLimiter);

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.json({
    message: "TaskFlow Server is running on port " + PORT,
  });
});

// Routes
app.use("/api/user",          userRouter);
app.use("/api/admin",         adminRouter);
app.use("/api/tasks",         taskRouter);
app.use("/api/superadmin",    superadminRouter);
app.use("/api/notifications", notifRouter);

// Connect to DataBase
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TaskFlow Server is running on port ${PORT}`);
  });
});
