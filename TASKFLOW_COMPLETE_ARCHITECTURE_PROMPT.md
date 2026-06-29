# ═══════════════════════════════════════════════════════════════
# TASKFLOW — MANUFACTURING TASK MANAGEMENT SYSTEM
# Complete Architecture-Level Development Prompt
# ═══════════════════════════════════════════════════════════════
#
# PROJECT STACK (already in your project):
#   Frontend : React 19 + Vite + Tailwind CSS v4 + Framer Motion
#              + Lucide React + React Icons + Recharts
#   Backend  : Node.js + Express 5 + MongoDB + Mongoose
#              + JWT + bcryptjs + Helmet + CORS + Morgan
#              + Cloudinary + Resend Email + Multer
#   Auth     : HTTP-only cookies + JWT Access (5h) + Refresh (7d)
#
# WHAT ALREADY EXISTS (DO NOT REWRITE, EXTEND):
#   ✅ register/login/logout controllers
#   ✅ email verification + OTP forgot-password flow
#   ✅ avatar upload to Cloudinary
#   ✅ refresh token mechanism
#   ✅ Login.jsx + Register.jsx UI (dark, Framer Motion)
#   ✅ Header, Footer, basic routing scaffold
#   ✅ User model with name/email/password/role/status
#   ✅ auth.js middleware (has a bug — fix it below)
# ═══════════════════════════════════════════════════════════════


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — BUGS TO FIX IN EXISTING CODE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUG 1 — server/middleware/auth.js
  PROBLEM : `request.header.authorization` crashes (header is a method, not object)
  FIX     : Replace the entire file with this:

```js
// server/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const auth = async (request, response, next) => {
  try {
    const token =
      request.cookies?.accessToken ||
      request.headers?.authorization?.split(" ")[1];

    if (!token) {
      return response.status(401).json({
        message: "Authentication token required",
        error: true,
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

    if (!decode) {
      return response.status(401).json({
        message: "Invalid or expired token",
        error: true,
        success: false,
      });
    }

    request.userId   = decode.id;
    request.userRole = decode.role; // ← attach role for downstream guards
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return response.status(401).json({
        message: "Token expired",
        error: true,
        success: false,
        code: "TOKEN_EXPIRED",
      });
    }
    return response.status(401).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export default auth;
```

BUG 2 — server/Utils/generatedAccessToken.js
  PROBLEM : Token payload only contains `id`, but role-guard needs `role` too.
  FIX     : Change the sign call:

```js
// server/Utils/generatedAccessToken.js
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

const generatedAccessToken = async (userId) => {
  const user = await UserModel.findById(userId).select("role");
  const token = jwt.sign(
    { id: userId, role: user.role },          // ← include role
    process.env.SECRET_KEY_ACCESS_TOKEN,
    { expiresIn: "15m" }                       // ← tighten from 5h to 15m
  );
  return token;
};

export default generatedAccessToken;
```

BUG 3 — server/controllers/user.controllers.js → loginController
  PROBLEM : `UserModel.findOne({ email, verify_email: false })` — this finds
            UNVERIFIED users only. Should be just `findOne({ email })`.
  FIX     : Change that line to:
            `const user = await UserModel.findOne({ email });`

BUG 4 — server/controllers/user.controllers.js → logoutController
  PROBLEM : `response.clearCookie("accesstoken")` — wrong case, should match
            how the cookie was SET: `"accessToken"` (capital T).
  FIX     : `response.clearCookie("accessToken");`


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — DATABASE SCHEMA CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 2A — EXTEND server/models/user.model.js ━━━

Keep all existing fields. ADD these new fields to the schema:

```js
// ADD inside userSchema definition (after existing fields):

role: {
  type: String,
  enum: ["superadmin", "admin", "sales", "marketing", "inventory", "user"],
  // REPLACE the existing role enum — remove "employee"/"customer"
  default: "user",
},

department: {
  type: String,
  enum: [
    "sales", "marketing", "inventory",
    "production", "quality", "logistics", "management",
  ],
  default: null,
},

// Who created this user (the Admin's _id, or null for SuperAdmin-created admins)
createdByAdmin: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

// Which admin manages this user (same as createdByAdmin usually)
managedByAdmin: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

employeeId: {
  type: String,
  unique: true,
  sparse: true,   // allows multiple nulls
  default: null,
},

isActive: {
  type: Boolean,
  default: true,
},
```

━━━ 2B — CREATE server/models/task.model.js ━━━

```js
import mongoose from "mongoose";

// Sub-schema: one physical item with quantity
const taskItemSchema = new mongoose.Schema(
  {
    itemName:  { type: String, required: true, trim: true },
    quantity:  { type: Number, required: true, min: 1 },
    unit:      { type: String, default: "pcs" },  // pcs, kg, litres, boxes …
    notes:     { type: String, default: "" },
  },
  { _id: false }
);

// Sub-schema: one step in the forward chain (full audit trail)
const forwardEntrySchema = new mongoose.Schema(
  {
    fromUser:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser:         { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    toDepartment:   { type: String, default: null },
    note:           { type: String, default: "" },
    forwardedAt:    { type: Date, default: Date.now },
    // time this step took to be accepted (set when next holder picks it up)
    acceptedAt:     { type: Date, default: null },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    // ── Core fields (all required by admin on creation) ──────────────
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      required: true,
      default: "medium",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: ["sales", "marketing", "inventory", "production", "quality", "logistics", "management"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned user is required"],
    },
    customer: {
      name:    { type: String, required: [true, "Customer name is required"] },
      company: { type: String, default: "" },
      email:   { type: String, default: "" },
      phone:   { type: String, default: "" },
    },
    selectedItems: {
      type: [taskItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one item is required",
      },
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    // ── Ownership ────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // the Admin who created the task

    // ── Live tracking ────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "in_progress", "forwarded", "completed", "cancelled"],
      default: "pending",
    },
    currentHolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // who has the task RIGHT NOW
    currentDepartment: {
      type: String,
      default: null,
    },

    // ── Timeline timestamps ──────────────────────────────────────────
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // ── Full audit trail (every forward step) ────────────────────────
    forwardHistory: [forwardEntrySchema],

    // ── Soft delete ──────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound indexes for fast dashboard queries
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ currentHolder: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ deadline: 1, status: 1 });

// Virtual: hours elapsed since creation
taskSchema.virtual("hoursElapsed").get(function () {
  const end = this.completedAt || new Date();
  return +((end - this.createdAt) / 3_600_000).toFixed(2);
});

// Virtual: is this task overdue?
taskSchema.virtual("isOverdue").get(function () {
  return (
    !this.completedAt &&
    this.status !== "cancelled" &&
    this.deadline < new Date()
  );
});

taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

const TaskModel = mongoose.model("Task", taskSchema);
export default TaskModel;
```

━━━ 2C — CREATE server/models/notification.model.js ━━━

```js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_started",
        "task_forwarded",
        "task_completed",
        "task_overdue",
        "user_created",
        "system",
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false, index: true },
    readAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const NotificationModel = mongoose.model("Notification", notificationSchema);
export default NotificationModel;
```


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — BACKEND FILE STRUCTURE (complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

server/
├── config/
│   ├── connectDB.js              ← existing (keep)
│   └── sendEmail.js              ← existing (keep)
├── controllers/
│   ├── user.controllers.js       ← existing + fix 4 bugs above
│   ├── admin.controllers.js      ← NEW (full code below)
│   ├── superadmin.controllers.js ← NEW (full code below)
│   ├── task.controllers.js       ← NEW (full code below)
│   └── notification.controllers.js ← NEW (full code below)
├── middleware/
│   ├── auth.js                   ← existing + bug fix (Section 1)
│   ├── multer.js                 ← existing (keep)
│   ├── roleGuard.js              ← NEW (full code below)
│   └── rateLimiter.js            ← NEW (full code below)
├── models/
│   ├── user.model.js             ← existing + extend (Section 2A)
│   ├── task.model.js             ← NEW (Section 2B)
│   └── notification.model.js     ← NEW (Section 2C)
├── route/
│   ├── user.route.js             ← existing (keep, add /profile route)
│   ├── admin.route.js            ← NEW
│   ├── superadmin.route.js       ← NEW
│   ├── task.route.js             ← NEW
│   └── notification.route.js     ← NEW
├── Utils/
│   ├── generatedAccessToken.js   ← existing + bug fix (Section 1)
│   ├── generatedRefreshToken.js  ← existing (keep)
│   ├── generatedOtp.js           ← existing (keep)
│   ├── uploadImageClodinary.js   ← existing (keep)
│   ├── verifyEmailTemplate.js    ← existing (keep)
│   └── forgotPasswordTemplate.js ← existing (keep)
├── scripts/
│   └── seedSuperAdmin.js         ← NEW (run once)
└── index.js                      ← existing + add new routes


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — NEW MIDDLEWARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 4A — server/middleware/roleGuard.js ━━━

```js
import UserModel from "../models/user.model.js";

/**
 * Usage:
 *   router.get("/route", auth, roleGuard("admin"), handler)
 *   router.get("/route", auth, roleGuard(["admin","superadmin"]), handler)
 */
export const roleGuard = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request, response, next) => {
    try {
      // request.userRole is set by auth.js — but double-check from DB
      const user = await UserModel.findById(request.userId).select(
        "role status isActive"
      );

      if (!user) {
        return response
          .status(404)
          .json({ message: "User not found", error: true, success: false });
      }
      if (!user.isActive || user.status !== "Active") {
        return response.status(403).json({
          message: "Account is suspended or inactive",
          error: true,
          success: false,
        });
      }
      if (!roles.includes(user.role)) {
        return response.status(403).json({
          message: `Access denied. Required role: ${roles.join(" or ")}`,
          error: true,
          success: false,
        });
      }

      request.userDoc = user; // attach full doc for controllers
      next();
    } catch (error) {
      return response
        .status(500)
        .json({ message: error.message, error: true, success: false });
    }
  };
};

// Convenience shortcuts
export const isSuperAdmin = roleGuard("superadmin");
export const isAdmin      = roleGuard(["admin", "superadmin"]);
export const isAnyUser    = roleGuard([
  "superadmin", "admin", "sales", "marketing", "inventory", "user",
]);
```

━━━ 4B — server/middleware/rateLimiter.js ━━━

```js
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 10,                   // max 10 auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
    error: true,
    success: false,
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min window
  max: 120,
  message: {
    message: "Rate limit exceeded. Slow down.",
    error: true,
    success: false,
  },
});
```

INSTALL: `cd server && npm install express-rate-limit`


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — NEW CONTROLLERS (complete implementations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 5A — server/controllers/admin.controllers.js ━━━

```js
import UserModel from "../models/user.model.js";
import TaskModel from "../models/task.model.js";
import NotificationModel from "../models/notification.model.js";
import bcryptjs from "bcryptjs";

// ─── Helper: send a notification ─────────────────────────────────────────────
async function notify({ recipient, sender, task, type, title, message }) {
  await new NotificationModel({ recipient, sender, task, type, title, message }).save();
}

// ─── Admin creates a new user under their management ─────────────────────────
export async function adminCreateUser(request, response) {
  try {
    const adminId = request.userId;
    const { name, email, password, role, department, mobile, employeeId } =
      request.body;

    // Validate required fields
    if (!name || !email || !password || !role || !department) {
      return response.status(400).json({
        message: "name, email, password, role, and department are all required",
        error: true,
        success: false,
      });
    }

    // Admin can only create these roles (not admin or superadmin)
    const allowedRoles = ["sales", "marketing", "inventory", "user"];
    if (!allowedRoles.includes(role)) {
      return response.status(403).json({
        message: `Admin cannot create role "${role}". Allowed: ${allowedRoles.join(", ")}`,
        error: true,
        success: false,
      });
    }

    const emailExists = await UserModel.findOne({ email });
    if (emailExists) {
      return response.status(409).json({
        message: "A user with that email already exists",
        error: true,
        success: false,
      });
    }

    if (employeeId) {
      const empExists = await UserModel.findOne({ employeeId });
      if (empExists) {
        return response.status(409).json({
          message: "That employee ID is already taken",
          error: true,
          success: false,
        });
      }
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = await new UserModel({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      mobile: mobile || null,
      employeeId: employeeId || null,
      createdByAdmin: adminId,
      managedByAdmin: adminId,
      verify_email: true, // admin-created users are pre-verified
      status: "Active",
      isActive: true,
    }).save();

    await notify({
      recipient: newUser._id,
      sender: adminId,
      type: "user_created",
      title: "Welcome to TaskFlow!",
      message: `Your account has been set up. Role: ${role}, Department: ${department}.`,
    });

    return response.status(201).json({
      message: "User created successfully",
      error: false,
      success: true,
      data: {
        _id: newUser._id,
        name,
        email,
        role,
        department,
        employeeId: newUser.employeeId,
      },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── Admin gets all users they manage (with filters & pagination) ─────────────
export async function adminGetMyUsers(request, response) {
  try {
    const adminId = request.userId;
    const {
      page = 1,
      limit = 20,
      role,
      department,
      status,
      search,
    } = request.query;

    const filter = { managedByAdmin: adminId };
    if (role)       filter.role       = role;
    if (department) filter.department = department;
    if (status)     filter.status     = status;
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: "i" } },
        { email:      { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select("-password -refresh_token -forgot_passward_otp -forgot_passward_expiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      UserModel.countDocuments(filter),
    ]);

    return response.json({
      success: true,
      error: false,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── Admin updates a user they manage ────────────────────────────────────────
export async function adminUpdateUser(request, response) {
  try {
    const adminId = request.userId;
    const { userId } = request.params;
    const { name, role, department, mobile, status, isActive, employeeId } =
      request.body;

    const user = await UserModel.findOne({ _id: userId, managedByAdmin: adminId });
    if (!user) {
      return response.status(404).json({
        message: "User not found or not under your management",
        error: true,
        success: false,
      });
    }

    const forbiddenRoles = ["superadmin", "admin"];
    if (role && forbiddenRoles.includes(role)) {
      return response.status(403).json({
        message: "Cannot assign a privileged role via this endpoint",
        error: true,
        success: false,
      });
    }

    const updates = {};
    if (name !== undefined)       updates.name       = name;
    if (role !== undefined)       updates.role       = role;
    if (department !== undefined) updates.department = department;
    if (mobile !== undefined)     updates.mobile     = mobile;
    if (status !== undefined)     updates.status     = status;
    if (isActive !== undefined)   updates.isActive   = isActive;
    if (employeeId !== undefined) updates.employeeId = employeeId;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password -refresh_token");

    return response.json({
      message: "User updated successfully",
      success: true,
      error: false,
      data: updated,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── Admin soft-deactivates a user they manage ───────────────────────────────
export async function adminDeactivateUser(request, response) {
  try {
    const adminId = request.userId;
    const { userId } = request.params;

    const user = await UserModel.findOne({ _id: userId, managedByAdmin: adminId });
    if (!user) {
      return response.status(404).json({
        message: "User not found or not under your management",
        error: true,
        success: false,
      });
    }

    await UserModel.findByIdAndUpdate(userId, {
      isActive: false,
      status: "Inactive",
    });

    return response.json({
      message: "User deactivated",
      success: true,
      error: false,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── Admin dashboard statistics ───────────────────────────────────────────────
export async function adminDashboardStats(request, response) {
  try {
    const adminId = request.userId;

    const [
      totalUsers,
      activeUsers,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      departmentBreakdown,
      recentTasks,
    ] = await Promise.all([
      UserModel.countDocuments({ managedByAdmin: adminId }),
      UserModel.countDocuments({ managedByAdmin: adminId, isActive: true }),
      TaskModel.countDocuments({ createdBy: adminId, isDeleted: false }),
      TaskModel.countDocuments({ createdBy: adminId, status: "pending",     isDeleted: false }),
      TaskModel.countDocuments({ createdBy: adminId, status: "in_progress", isDeleted: false }),
      TaskModel.countDocuments({ createdBy: adminId, status: "completed",   isDeleted: false }),
      TaskModel.countDocuments({
        createdBy: adminId,
        status: { $in: ["pending", "in_progress", "forwarded"] },
        deadline: { $lt: new Date() },
        isDeleted: false,
      }),
      TaskModel.aggregate([
        { $match: { createdBy: adminId, isDeleted: false } },
        {
          $group: {
            _id: "$department",
            total:     { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$status", "completed"] },
                      { $lt: ["$deadline", new Date()] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),
      TaskModel.find({ createdBy: adminId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("assignedTo",    "name department role avatar")
        .populate("currentHolder", "name department avatar"),
    ]);

    return response.json({
      success: true,
      error: false,
      data: {
        users: { total: totalUsers, active: activeUsers },
        tasks: {
          total:      totalTasks,
          pending:    pendingTasks,
          inProgress: inProgressTasks,
          completed:  completedTasks,
          overdue:    overdueTasks,
        },
        departmentBreakdown,
        recentTasks,
      },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
```

━━━ 5B — server/controllers/task.controllers.js ━━━

```js
import TaskModel from "../models/task.model.js";
import UserModel from "../models/user.model.js";
import NotificationModel from "../models/notification.model.js";

async function notify({ recipient, sender, task, type, title, message }) {
  if (!recipient) return;
  await new NotificationModel({ recipient, sender, task, type, title, message }).save();
}

// ─── ADMIN: Create a task ─────────────────────────────────────────────────────
export async function createTask(request, response) {
  try {
    const adminId = request.userId;
    const {
      title,
      description,
      priority,
      department,
      assignedTo,   // user _id
      customer,     // { name, company, email, phone }
      selectedItems, // [{ itemName, quantity, unit, notes }]
      deadline,
    } = request.body;

    // ── Validate all required fields ──────────────────────────────────
    if (
      !title ||
      !description ||
      !priority ||
      !department ||
      !assignedTo ||
      !customer?.name ||
      !selectedItems?.length ||
      !deadline
    ) {
      return response.status(400).json({
        message:
          "All fields are required: title, description, priority, department, " +
          "assignedTo (userId), customer.name, selectedItems (min 1), deadline",
        error: true,
        success: false,
        missingFields: {
          title:         !title,
          description:   !description,
          priority:      !priority,
          department:    !department,
          assignedTo:    !assignedTo,
          customerName:  !customer?.name,
          selectedItems: !selectedItems?.length,
          deadline:      !deadline,
        },
      });
    }

    if (new Date(deadline) <= new Date()) {
      return response.status(400).json({
        message: "Deadline must be a future date/time",
        error: true,
        success: false,
      });
    }

    // ── Verify assigned user belongs to this admin ────────────────────
    const assignedUser = await UserModel.findOne({
      _id:           assignedTo,
      managedByAdmin: adminId,
      isActive:      true,
    });
    if (!assignedUser) {
      return response.status(404).json({
        message: "Assigned user not found or not under your management",
        error: true,
        success: false,
      });
    }

    const task = await new TaskModel({
      title,
      description,
      priority,
      department,
      assignedTo,
      createdBy:         adminId,
      customer,
      selectedItems,
      deadline:          new Date(deadline),
      status:            "pending",
      currentHolder:     assignedTo,
      currentDepartment: department,
    }).save();

    // Notify the assigned user
    await notify({
      recipient: assignedTo,
      sender:    adminId,
      task:      task._id,
      type:      "task_assigned",
      title:     `New Task: ${title}`,
      message: `You have been assigned a new ${priority}-priority task. ` +
               `Deadline: ${new Date(deadline).toLocaleDateString("en-IN")}.`,
    });

    return response.status(201).json({
      message: "Task created successfully",
      success: true,
      error:   false,
      data:    task,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── ADMIN: Get all tasks they created (with filters) ────────────────────────
export async function adminGetAllTasks(request, response) {
  try {
    const adminId = request.userId;
    const {
      page = 1,
      limit = 20,
      status,
      department,
      priority,
      search,
      overdueOnly,
    } = request.query;

    const filter = { createdBy: adminId, isDeleted: false };
    if (status)     filter.status     = status;
    if (department) filter.department = department;
    if (priority)   filter.priority   = priority;
    if (search)     filter.title      = { $regex: search, $options: "i" };
    if (overdueOnly === "true") {
      filter.status   = { $in: ["pending", "in_progress", "forwarded"] };
      filter.deadline = { $lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      TaskModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("assignedTo",    "name email department role avatar")
        .populate("currentHolder", "name email department avatar")
        .populate("forwardHistory.fromUser", "name department")
        .populate("forwardHistory.toUser",   "name department"),
      TaskModel.countDocuments(filter),
    ]);

    return response.json({
      success: true,
      error:   false,
      data:    tasks,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── ADMIN: Get single task with full timeline ───────────────────────────────
export async function adminGetTaskTimeline(request, response) {
  try {
    const adminId = request.userId;
    const { taskId } = request.params;

    const task = await TaskModel.findOne({
      _id:       taskId,
      createdBy: adminId,
      isDeleted: false,
    })
      .populate("assignedTo",                "name email department role avatar")
      .populate("currentHolder",             "name email department role avatar")
      .populate("createdBy",                 "name email")
      .populate("forwardHistory.fromUser",   "name department avatar")
      .populate("forwardHistory.toUser",     "name department avatar");

    if (!task) {
      return response.status(404).json({
        message: "Task not found",
        error: true,
        success: false,
      });
    }

    return response.json({ success: true, error: false, data: task });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── ADMIN: Update a task ─────────────────────────────────────────────────────
export async function adminUpdateTask(request, response) {
  try {
    const adminId = request.userId;
    const { taskId } = request.params;

    const task = await TaskModel.findOne({ _id: taskId, createdBy: adminId, isDeleted: false });
    if (!task) {
      return response.status(404).json({ message: "Task not found", error: true, success: false });
    }

    const allowed = ["title", "description", "priority", "deadline", "customer", "selectedItems"];
    const updates = {};
    allowed.forEach((k) => {
      if (request.body[k] !== undefined) updates[k] = request.body[k];
    });

    const updated = await TaskModel.findByIdAndUpdate(taskId, { $set: updates }, { new: true });
    return response.json({ success: true, error: false, data: updated });
  } catch (error) {
    return response.status(500).json({ message: error.message, error: true, success: false });
  }
}

// ─── USER: Get tasks currently assigned to them ──────────────────────────────
export async function userGetMyTasks(request, response) {
  try {
    const userId = request.userId;
    const { status, page = 1, limit = 10 } = request.query;

    const filter = { currentHolder: userId, isDeleted: false };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      TaskModel.find(filter)
        .sort({ deadline: 1 })        // closest deadline first
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy",    "name email")
        .populate("assignedTo",   "name department"),
      TaskModel.countDocuments(filter),
    ]);

    return response.json({
      success: true,
      error:   false,
      data:    tasks,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── USER: Start a task (pending → in_progress) ──────────────────────────────
export async function userStartTask(request, response) {
  try {
    const userId = request.userId;
    const { taskId } = request.params;

    const task = await TaskModel.findOne({
      _id:           taskId,
      currentHolder: userId,
      isDeleted:     false,
    });
    if (!task) {
      return response
        .status(404)
        .json({ message: "Task not found or not assigned to you", error: true, success: false });
    }
    if (task.status !== "pending" && task.status !== "forwarded") {
      return response
        .status(400)
        .json({ message: `Cannot start a task with status "${task.status}"`, error: true, success: false });
    }

    await TaskModel.findByIdAndUpdate(taskId, {
      status:    "in_progress",
      startedAt: new Date(),
    });

    // Notify admin
    await notify({
      recipient: task.createdBy,
      sender:    userId,
      task:      taskId,
      type:      "task_started",
      title:     `Task Started: ${task.title}`,
      message:   `Task "${task.title}" has been started by the assigned user.`,
    });

    return response.json({ message: "Task started", success: true, error: false });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── USER: Complete a task ────────────────────────────────────────────────────
export async function userCompleteTask(request, response) {
  try {
    const userId = request.userId;
    const { taskId } = request.params;
    const { completionNote } = request.body;

    const task = await TaskModel.findOne({
      _id:           taskId,
      currentHolder: userId,
      isDeleted:     false,
    });
    if (!task) {
      return response
        .status(404)
        .json({ message: "Task not found or not assigned to you", error: true, success: false });
    }
    if (!["in_progress", "forwarded"].includes(task.status)) {
      return response.status(400).json({
        message: `Only in_progress or forwarded tasks can be completed. Current: "${task.status}"`,
        error: true,
        success: false,
      });
    }

    await TaskModel.findByIdAndUpdate(taskId, {
      status:      "completed",
      completedAt: new Date(),
    });

    // Notify admin — task is done
    await notify({
      recipient: task.createdBy,
      sender:    userId,
      task:      taskId,
      type:      "task_completed",
      title:     `✅ Task Completed: ${task.title}`,
      message:
        `Task "${task.title}" for customer "${task.customer.name}" ` +
        `has been marked as completed.` +
        (completionNote ? ` Note: ${completionNote}` : ""),
    });

    return response.json({
      message: "Task marked as completed. Admin has been notified.",
      success: true,
      error:   false,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── USER: Forward a task to another user or department ──────────────────────
export async function userForwardTask(request, response) {
  try {
    const fromUserId = request.userId;
    const { taskId } = request.params;
    const { toUserId, toDepartment, note } = request.body;

    if (!toUserId && !toDepartment) {
      return response.status(400).json({
        message: "Provide toUserId or toDepartment (or both)",
        error: true,
        success: false,
      });
    }

    const task = await TaskModel.findOne({
      _id:           taskId,
      currentHolder: fromUserId,
      isDeleted:     false,
    });
    if (!task) {
      return response.status(404).json({
        message: "Task not found or you are not the current holder",
        error: true,
        success: false,
      });
    }
    if (task.status === "completed" || task.status === "cancelled") {
      return response.status(400).json({
        message: "Cannot forward a completed or cancelled task",
        error: true,
        success: false,
      });
    }

    let nextHolderId  = toUserId || null;
    let nextDept      = toDepartment || task.currentDepartment;

    if (toUserId) {
      const targetUser = await UserModel.findOne({ _id: toUserId, isActive: true });
      if (!targetUser) {
        return response
          .status(404)
          .json({ message: "Target user not found or inactive", error: true, success: false });
      }
      nextDept = targetUser.department;
    }

    const forwardEntry = {
      fromUser:     fromUserId,
      toUser:       nextHolderId,
      toDepartment: nextDept,
      note:         note || "",
      forwardedAt:  new Date(),
    };

    await TaskModel.findByIdAndUpdate(taskId, {
      status:            "forwarded",
      currentHolder:     nextHolderId,
      currentDepartment: nextDept,
      $push:             { forwardHistory: forwardEntry },
    });

    // Notify next holder (if a specific user)
    if (nextHolderId) {
      await notify({
        recipient: nextHolderId,
        sender:    fromUserId,
        task:      taskId,
        type:      "task_forwarded",
        title:     `Task Forwarded to You: ${task.title}`,
        message:   `A task has been forwarded to you.${note ? " Note: " + note : ""}`,
      });
    }

    // Always notify admin too
    await notify({
      recipient: task.createdBy,
      sender:    fromUserId,
      task:      taskId,
      type:      "task_forwarded",
      title:     `Task Forwarded: ${task.title}`,
      message: `Task moved to ${nextDept || "next step"}` +
               (note ? `. Note: ${note}` : "."),
    });

    return response.json({
      message: "Task forwarded successfully",
      success: true,
      error:   false,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── USER: Get single task detail ────────────────────────────────────────────
export async function userGetTaskDetail(request, response) {
  try {
    const userId = request.userId;
    const { taskId } = request.params;

    const task = await TaskModel.findOne({
      _id:       taskId,
      isDeleted: false,
      $or: [{ assignedTo: userId }, { currentHolder: userId }],
    })
      .populate("createdBy",                "name email")
      .populate("assignedTo",               "name department avatar")
      .populate("currentHolder",            "name department avatar")
      .populate("forwardHistory.fromUser",  "name department avatar")
      .populate("forwardHistory.toUser",    "name department avatar");

    if (!task) {
      return response
        .status(404)
        .json({ message: "Task not found", error: true, success: false });
    }

    return response.json({ success: true, error: false, data: task });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
```

━━━ 5C — server/controllers/superadmin.controllers.js ━━━

```js
import UserModel from "../models/user.model.js";
import TaskModel from "../models/task.model.js";
import bcryptjs from "bcryptjs";

// ─── SuperAdmin: Create a new Admin ──────────────────────────────────────────
export async function createAdmin(request, response) {
  try {
    const { name, email, password, mobile, department } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "name, email, and password are required",
        error: true,
        success: false,
      });
    }

    const exists = await UserModel.findOne({ email });
    if (exists) {
      return response
        .status(409)
        .json({ message: "Email already registered", error: true, success: false });
    }

    const salt   = await bcryptjs.genSalt(10);
    const hashed = await bcryptjs.hash(password, salt);

    const admin = await new UserModel({
      name,
      email,
      password:     hashed,
      mobile:       mobile || null,
      department:   department || null,
      role:         "admin",
      verify_email: true,
      status:       "Active",
      isActive:     true,
      createdByAdmin: request.userId,
    }).save();

    return response.status(201).json({
      message: "Admin account created",
      success: true,
      error:   false,
      data: { _id: admin._id, name, email, role: "admin" },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── SuperAdmin: Get all Admins with their stats ─────────────────────────────
export async function getAllAdmins(request, response) {
  try {
    const admins = await UserModel.find({ role: "admin" }).select(
      "-password -refresh_token"
    );

    const adminIds = admins.map((a) => a._id);

    const [userCounts, taskStats] = await Promise.all([
      UserModel.aggregate([
        { $match: { managedByAdmin: { $in: adminIds } } },
        { $group: { _id: "$managedByAdmin", count: { $sum: 1 } } },
      ]),
      TaskModel.aggregate([
        { $match: { createdBy: { $in: adminIds }, isDeleted: false } },
        {
          $group: {
            _id:       "$createdBy",
            total:     { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne:  ["$status", "completed"] },
                    { $lt:  ["$deadline", new Date()] },
                  ]},
                  1, 0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const userMap = Object.fromEntries(userCounts.map((u) => [String(u._id), u.count]));
    const taskMap = Object.fromEntries(
      taskStats.map((t) => [String(t._id), { total: t.total, completed: t.completed, overdue: t.overdue }])
    );

    const enriched = admins.map((a) => ({
      ...a.toObject(),
      userCount: userMap[String(a._id)] || 0,
      taskStats: taskMap[String(a._id)] || { total: 0, completed: 0, overdue: 0 },
    }));

    return response.json({ success: true, error: false, data: enriched });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── SuperAdmin: Suspend / Reinstate an Admin ────────────────────────────────
export async function toggleAdminStatus(request, response) {
  try {
    const { adminId } = request.params;
    const admin = await UserModel.findOne({ _id: adminId, role: "admin" });
    if (!admin) {
      return response.status(404).json({ message: "Admin not found", error: true, success: false });
    }

    const newStatus   = admin.status === "Active" ? "Suspended" : "Active";
    const newIsActive = newStatus === "Active";

    await UserModel.findByIdAndUpdate(adminId, { status: newStatus, isActive: newIsActive });

    return response.json({
      message:    `Admin ${newStatus === "Active" ? "reinstated" : "suspended"}`,
      success:    true,
      error:      false,
      newStatus,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

// ─── SuperAdmin: Platform-wide dashboard ─────────────────────────────────────
export async function superAdminDashboard(request, response) {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByDept,
      recentAdmins,
      tasksByPriority,
    ] = await Promise.all([
      UserModel.countDocuments({ role: { $nin: ["superadmin", "admin"] } }),
      UserModel.countDocuments({ role: "admin" }),
      TaskModel.countDocuments({ isDeleted: false }),
      TaskModel.countDocuments({ status: "completed", isDeleted: false }),
      TaskModel.countDocuments({
        status:   { $in: ["pending", "in_progress", "forwarded"] },
        deadline: { $lt: new Date() },
        isDeleted: false,
      }),
      TaskModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$department", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status","completed"] }, 1, 0] } } } },
        { $sort: { total: -1 } },
      ]),
      UserModel.find({ role: "admin" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("-password -refresh_token"),
      TaskModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    ]);

    return response.json({
      success: true,
      error:   false,
      data: {
        totalUsers,
        totalAdmins,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks ? +((completedTasks / totalTasks) * 100).toFixed(1) : 0,
        tasksByDept,
        tasksByPriority,
        recentAdmins,
      },
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
```

━━━ 5D — server/controllers/notification.controllers.js ━━━

```js
import NotificationModel from "../models/notification.model.js";

export async function getNotifications(request, response) {
  try {
    const { page = 1, limit = 30, unreadOnly } = request.query;
    const filter = { recipient: request.userId };
    if (unreadOnly === "true") filter.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("task",   "title status")
        .populate("sender", "name role avatar"),
      NotificationModel.countDocuments({ recipient: request.userId, isRead: false }),
    ]);

    return response.json({
      success: true,
      error:   false,
      data:    notifications,
      unreadCount,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

export async function markAllRead(request, response) {
  try {
    await NotificationModel.updateMany(
      { recipient: request.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return response.json({ message: "All notifications marked as read", success: true, error: false });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}

export async function markOneRead(request, response) {
  try {
    await NotificationModel.findOneAndUpdate(
      { _id: request.params.id, recipient: request.userId },
      { isRead: true, readAt: new Date() }
    );
    return response.json({ success: true, error: false });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message, error: true, success: false });
  }
}
```


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — ROUTE FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 6A — server/route/user.route.js — ADD profile route ━━━

Add at the end (before `export default userRouter`):
```js
import { getUserProfile } from "../controllers/user.controllers.js";
// Add this export to user.controllers.js:
// export async function getUserProfile(req, res) {
//   const user = await UserModel.findById(req.userId).select("-password -refresh_token -forgot_passward_otp");
//   if (!user) return res.status(404).json({ message: "User not found", error: true });
//   return res.json({ success: true, error: false, data: user });
// }

userRouter.get('/profile', auth, getUserProfile);
```

━━━ 6B — server/route/admin.route.js (NEW) ━━━

```js
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
```

━━━ 6C — server/route/task.route.js (NEW) ━━━

```js
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

// User endpoints
taskRouter.get("/my",                  auth, userGetMyTasks);
taskRouter.get("/:taskId",             auth, userGetTaskDetail);
taskRouter.patch("/:taskId/start",     auth, userStartTask);
taskRouter.patch("/:taskId/complete",  auth, userCompleteTask);
taskRouter.post("/:taskId/forward",    auth, userForwardTask);

export default taskRouter;
```

━━━ 6D — server/route/superadmin.route.js (NEW) ━━━

```js
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
```

━━━ 6E — server/route/notification.route.js (NEW) ━━━

```js
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
```

━━━ 6F — server/index.js — ADD new routes ━━━

Add these imports and app.use() calls to the existing index.js:

```js
// Add these imports after existing imports:
import adminRouter        from "./route/admin.route.js";
import taskRouter         from "./route/task.route.js";
import superadminRouter   from "./route/superadmin.route.js";
import notifRouter        from "./route/notification.route.js";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.js";

// Add these BEFORE the existing app.use("/api/user", userRouter) line:
app.use(apiLimiter);  // global rate limit

// Then after existing userRouter line:
app.use("/api/admin",        adminRouter);
app.use("/api/tasks",        taskRouter);
app.use("/api/superadmin",   superadminRouter);
app.use("/api/notifications", notifRouter);

// Apply auth limiter specifically to login/register:
// In user.route.js, import authLimiter and add it:
// userRouter.post('/login',    authLimiter, loginController)
// userRouter.post('/register', authLimiter, registerUserController)
```


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — SEED SCRIPT (run once)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE server/scripts/seedSuperAdmin.js:

```js
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import UserModel from "../models/user.model.js";
import connectDB from "../config/connectDB.js";

await connectDB();

const existing = await UserModel.findOne({ role: "superadmin" });
if (existing) {
  console.log("✅ SuperAdmin already exists:", existing.email);
  process.exit(0);
}

const salt     = await bcryptjs.genSalt(10);
const password = await bcryptjs.hash("SuperAdmin@123", salt);

const sa = await new UserModel({
  name:         "Super Admin",
  email:        "superadmin@taskflow.com",
  password,
  role:         "superadmin",
  verify_email: true,
  status:       "Active",
  isActive:     true,
}).save();

console.log("✅ SuperAdmin created!");
console.log("   Email   :", sa.email);
console.log("   Password: SuperAdmin@123");
console.log("   ⚠️  Change this password after first login!");
process.exit(0);
```

Run: `node server/scripts/seedSuperAdmin.js`


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — FRONTEND FILE STRUCTURE (complete)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

client/src/
├── api/
│   ├── axios.js                  ← Axios instance + interceptors
│   ├── authAPI.js                ← login, logout, register, profile
│   ├── adminAPI.js               ← create/get/update users, dashboard
│   ├── taskAPI.js                ← all task endpoints
│   ├── superadminAPI.js          ← superadmin endpoints
│   └── notificationAPI.js        ← notification endpoints
├── context/
│   ├── AuthContext.jsx            ← global auth state (user, login, logout)
│   └── NotificationContext.jsx    ← unread count + polling
├── hooks/
│   ├── useAuth.js
│   ├── useNotifications.js
│   └── useTasks.js
├── components/
│   ├── common/
│   │   ├── ProtectedRoute.jsx     ← role-based route guard
│   │   ├── Sidebar.jsx            ← dashboard sidebar (responsive)
│   │   ├── TopBar.jsx             ← top nav with notifications + avatar
│   │   ├── NotificationPanel.jsx  ← slide-in notification drawer
│   │   ├── LoadingSpinner.jsx
│   │   ├── Toast.jsx              ← (use react-hot-toast)
│   │   ├── Modal.jsx              ← reusable modal wrapper
│   │   ├── StatCard.jsx           ← animated stat card for dashboards
│   │   ├── PriorityBadge.jsx      ← color-coded priority chip
│   │   └── StatusBadge.jsx        ← color-coded status chip
│   ├── task/
│   │   ├── TaskCard.jsx           ← user task card (with action buttons)
│   │   ├── TaskTimeline.jsx       ← admin forward-history timeline
│   │   ├── ForwardTaskModal.jsx   ← modal: forward to user/dept + note
│   │   └── TaskCreateForm.jsx     ← full admin create-task form
│   └── home/
│       ├── HeroSection.jsx
│       ├── FeaturesSection.jsx
│       ├── HowItWorksSection.jsx
│       ├── StatsSection.jsx
│       └── CTASection.jsx
├── pages/
│   ├── Home.jsx                   ← animated landing page (FULL REWRITE)
│   ├── Login.jsx                  ← existing + wire to API
│   ├── Register.jsx               ← existing (public self-registration)
│   ├── dashboards/
│   │   ├── SuperAdminDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── UserDashboard.jsx
│   ├── admin/
│   │   ├── ManageUsers.jsx        ← table: admin's users
│   │   ├── CreateUser.jsx         ← form: admin creates user
│   │   ├── CreateTask.jsx         ← form: admin creates task (all 8 fields)
│   │   └── TaskTracker.jsx        ← table + timeline drawer
│   └── user/
│       ├── MyTasks.jsx            ← user's task list
│       └── TaskDetail.jsx         ← single task + forward/complete actions
├── routes/
│   └── index.jsx                  ← updated with all protected routes
├── App.jsx                        ← updated layout logic
└── main.jsx                       ← wrap with AuthProvider


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — FRONTEND CORE FILES (complete implementations)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ 9A — client/src/api/axios.js ━━━

```js
import axios from "axios";

const API = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: true,
  timeout:         12000,
});

// Attach stored token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let queue = [];

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.data.accesstoken;
        localStorage.setItem("tf_access_token", newToken);
        queue.forEach((p) => p.resolve(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch (refreshError) {
        queue.forEach((p) => p.reject(refreshError));
        queue = [];
        localStorage.removeItem("tf_access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default API;
```

━━━ 9B — client/src/context/AuthContext.jsx ━━━

```jsx
import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

const init = { user: null, loading: true, isAuthenticated: false };

function reducer(state, action) {
  switch (action.type) {
    case "SET_USER":  return { user: action.payload, loading: false, isAuthenticated: true };
    case "LOGOUT":    return { user: null,           loading: false, isAuthenticated: false };
    case "DONE":      return { ...state,              loading: false };
    default:          return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);

  // On mount — try to restore session
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/api/user/profile");
        dispatch({ type: "SET_USER", payload: res.data.data });
      } catch {
        dispatch({ type: "DONE" });
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await API.post("/api/user/login", { email, password });
    const { accesstoken, user } = res.data.data;
    if (accesstoken) localStorage.setItem("tf_access_token", accesstoken);
    // Fetch full profile (login doesn't return user object in current controller)
    const profile = await API.get("/api/user/profile");
    dispatch({ type: "SET_USER", payload: profile.data.data });
    return profile.data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await API.get("/api/user/logout"); } catch {}
    localStorage.removeItem("tf_access_token");
    dispatch({ type: "LOGOUT" });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

━━━ 9C — client/src/components/common/ProtectedRoute.jsx ━━━

```jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Spinner shown while session is being restored
function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  );
}

// Role → default dashboard mapping
const ROLE_HOME = {
  superadmin: "/superadmin/dashboard",
  admin:      "/admin/dashboard",
  sales:      "/user/dashboard",
  marketing:  "/user/dashboard",
  inventory:  "/user/dashboard",
  user:       "/user/dashboard",
};

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // User is logged in but wrong role — redirect to their home
    return <Navigate to={ROLE_HOME[user?.role] || "/"} replace />;
  }

  return children;
}

// Used on /dashboard to auto-redirect to correct dashboard after login
export function RoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading)          return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || "/"} replace />;
}
```

━━━ 9D — client/src/routes/index.jsx (FULL REWRITE) ━━━

```jsx
import { createBrowserRouter } from "react-router-dom";
import App              from "../App.jsx";
import DashboardLayout  from "../components/common/DashboardLayout.jsx"; // NEW layout for dashboards
import { ProtectedRoute, RoleRedirect } from "../components/common/ProtectedRoute.jsx";

// Public pages
import Home     from "../pages/Home.jsx";
import Login    from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

// Dashboards
import SuperAdminDashboard from "../pages/dashboards/SuperAdminDashboard.jsx";
import AdminDashboard      from "../pages/dashboards/AdminDashboard.jsx";
import UserDashboard       from "../pages/dashboards/UserDashboard.jsx";

// Admin pages
import ManageUsers from "../pages/admin/ManageUsers.jsx";
import CreateUser  from "../pages/admin/CreateUser.jsx";
import CreateTask  from "../pages/admin/CreateTask.jsx";
import TaskTracker from "../pages/admin/TaskTracker.jsx";

// User pages
import MyTasks    from "../pages/user/MyTasks.jsx";
import TaskDetail from "../pages/user/TaskDetail.jsx";

const ADMIN_ROLES = ["admin", "superadmin"];
const ALL_ROLES   = ["superadmin", "admin", "sales", "marketing", "inventory", "user"];

const router = createBrowserRouter([
  // ── Public layout (Header + Footer) ───────────────────────────────────
  {
    path: "/",
    element: <App />,
    children: [
      { index: true,     element: <Home /> },
      { path: "login",   element: <Login /> },
      { path: "register",element: <Register /> },
      { path: "dashboard",element: <RoleRedirect /> },
    ],
  },

  // ── Dashboard layout (Sidebar + TopBar, no public Header/Footer) ──────
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      // SuperAdmin
      {
        path: "superadmin/dashboard",
        element: <ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminDashboard /></ProtectedRoute>,
      },

      // Admin
      {
        path: "admin/dashboard",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>,
      },
      {
        path: "admin/users",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><ManageUsers /></ProtectedRoute>,
      },
      {
        path: "admin/users/create",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateUser /></ProtectedRoute>,
      },
      {
        path: "admin/tasks/create",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateTask /></ProtectedRoute>,
      },
      {
        path: "admin/tasks",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><TaskTracker /></ProtectedRoute>,
      },

      // User
      {
        path: "user/dashboard",
        element: <ProtectedRoute allowedRoles={ALL_ROLES}><UserDashboard /></ProtectedRoute>,
      },
      {
        path: "user/tasks",
        element: <ProtectedRoute allowedRoles={ALL_ROLES}><MyTasks /></ProtectedRoute>,
      },
      {
        path: "user/tasks/:taskId",
        element: <ProtectedRoute allowedRoles={ALL_ROLES}><TaskDetail /></ProtectedRoute>,
      },
    ],
  },
]);

export default router;
```

━━━ 9E — client/src/App.jsx (UPDATE) ━━━

```jsx
// App.jsx is now ONLY for the public layout (Home/Login/Register)
import { Outlet } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
export default App;
```

CREATE client/src/components/common/DashboardLayout.jsx:

```jsx
// Separate layout for authenticated dashboard pages
// No public Header/Footer — has Sidebar + TopBar instead
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopBar  from "./TopBar.jsx";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar role={user?.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

━━━ 9F — client/src/main.jsx (UPDATE) ━━━

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";  // npm install react-hot-toast
import router from "./routes/index.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
          },
        }}
      />
    </AuthProvider>
  </StrictMode>
);
```


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — HOME PAGE SPECIFICATION (full redesign)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN DIRECTION: "Industrial Precision" — dark steel tones (#0a0f1e navy,
#0f172a slate), electric cyan (#06b6d4) + amber (#f59e0b) accents,
geometric grid overlays, sharp angular sections, industrial monospace
labels mixed with clean sans-serif body. Mobile-first. Scroll-triggered
animations via Framer Motion. NO purple gradients, NO generic layouts.

TYPOGRAPHY:
  Display headings : 'Syne' (Google Font) — bold, geometric, modern
  Body copy        : 'DM Sans' — clean, readable
  Labels/badges    : monospace accent text (font-mono text-cyan-400)

COLORS (CSS variables in index.css):
  --bg-deep    : #060d1f
  --bg-surface : #0f172a
  --bg-card    : #1e293b
  --accent-cyan: #06b6d4
  --accent-amber: #f59e0b
  --text-primary: #f1f5f9
  --text-muted : #64748b
  --border     : #1e293b

SECTIONS TO BUILD IN Home.jsx:

━━ SECTION 1: HERO ━━
  Layout: Full viewport height, centered content
  Left side (60%): 
    - Monospace label: "// MANUFACTURING TASK SYSTEM v2.0"
    - Main headline (2 lines): "Engineer Your" / "Workflow."
      (Use staggered word animation — each word fades+slides up on load)
    - Subline: "TaskFlow gives manufacturing teams total visibility —
       from task creation through department handoffs to final delivery."
    - Two CTAs:
        Primary: "Start Free Trial" → /register
          (bg-cyan-500 hover:bg-cyan-400 with ArrowRight icon)
        Secondary: "Watch Demo" → smooth scroll to #how-it-works
          (border border-slate-700 hover:border-cyan-500)
    - Social proof: "Trusted by 50+ manufacturing teams"
      with 5 placeholder avatar circles

  Right side (40%):
    - Animated dashboard mockup — floating card (Framer Motion y-oscillation)
      Show a fake TaskCard with: task title, priority badge, department,
      progress bar, deadline. Rotate slightly (-3deg). Add a subtle
      glow effect: box-shadow: 0 0 40px rgba(6,182,212,0.15)

  Background:
    - Very subtle grid pattern (CSS background-image with SVG lines)
    - Two large blurred circles (absolute positioned):
        cyan at top-right opacity-5, amber at bottom-left opacity-5

━━ SECTION 2: STATS BAR ━━
  Full-width dark bar between hero and features
  4 animated count-up numbers:
    "3"     — Dashboards (SuperAdmin, Admin, User)
    "6+"    — Department Roles
    "100%"  — Task Audit Trail
    "Real-time" — Notifications
  Use Framer Motion whileInView to trigger count animation

━━ SECTION 3: FEATURES ━━
  Heading: "Everything your factory floor needs"
  6 feature cards in 2×3 grid (mobile: 1 col, tablet: 2, desktop: 3)
  Each card: icon (Lucide) + title + 2-line description
  Cards have glassmorphism style: bg-white/5 backdrop-blur-sm border
  border-white/10 rounded-xl. Staggered fade-in on scroll.

  Features:
  1. 🔐 Role-Based Access Control
     "SuperAdmin controls Admins. Admins control their team only."
  2. 📋 Smart Task Creation
     "8 required fields capture everything: customer, items, quantities, deadline."
  3. 🔄 Department Forwarding
     "Users forward tasks to next department. Full chain is logged."
  4. 📊 Real-Time Admin Dashboard
     "Watch tasks move through departments with time-elapsed tracking."
  5. 🔔 Instant Notifications
     "Every action — assigned, started, forwarded, completed — triggers an alert."
  6. 📱 Mobile-First Design
     "Works seamlessly on phones on the factory floor."

━━ SECTION 4: HOW IT WORKS ━━
  id="how-it-works"
  Heading: "From assignment to delivery"
  Subheading: "Four simple steps, complete visibility"

  Animated vertical timeline (desktop: alternating left/right,
  mobile: straight vertical):
  
  Step 1: Admin Creates Task
    Icon: ClipboardList (cyan)
    "Fill in title, description, priority, department, assigned user,
    customer info, item quantities, and deadline. All fields required."

  Step 2: User Receives Task
    Icon: Bell (amber)
    "Instant notification. The task appears in the user's dashboard with
    all context — no back-and-forth needed."

  Step 3: Work & Forward
    Icon: ArrowRight (cyan)
    "User works on the task, then marks complete or forwards to the next
    department with a note. The admin sees every move in real-time."

  Step 4: Admin Sees Everything
    Icon: LayoutDashboard (amber)
    "Track which department holds the task, how long each step took,
    and get notified the instant it's done."

  Animate: Each step slides in from alternating sides using Framer Motion
  useInView. Connect steps with an animated vertical line that 'draws'
  downward as user scrolls.

━━ SECTION 5: DASHBOARD PREVIEW ━━
  Heading: "Three dashboards. Zero confusion."
  Three columns (mobile: stacked, desktop: side-by-side):
    
    SuperAdmin Card (border-amber-500/30):
      Title: "SuperAdmin"
      Description: "God-mode access. Create admins, view all tasks,
      monitor platform health."
      Features list: Create Admins, Platform Analytics, Suspend Users,
      Global Task View
    
    Admin Card (border-cyan-500/30) — FEATURED (slightly larger/brighter):
      Title: "Admin" + "Most Used" badge
      Description: "Your command center. Manage your team, create tasks,
      track every step."
      Features list: Create Users (Sales/Marketing/Inventory), Create Tasks
      (8 fields), Real-Time Tracker, Department Analytics
    
    User Card (border-slate-500/30):
      Title: "User"
      Description: "Clean, focused task view. Start, complete, or forward
      tasks with one click."
      Features list: My Task Queue, Start/Complete Actions, Forward to Dept,
      Notification Center

━━ SECTION 6: CTA ━━
  Dark section with cyan gradient border on the card
  Heading: "Ready to streamline your manufacturing workflow?"
  Subheading: "Join 50+ manufacturing teams using TaskFlow."
  Two buttons: "Get Started Free" + "Schedule a Demo"
  Small print: "No credit card required • Setup in 5 minutes"

━━ FOOTER ━━
  Logo (TaskFlow) + tagline: "Built for manufacturing. Designed for clarity."
  Links: Home | Features | Login | Register
  Bottom bar: © 2025 TaskFlow | Privacy | Terms
  Small animated cyan dot pulsing next to "System Operational"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — TASK CREATE FORM (Admin) — All 8 Required Fields
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE: client/src/pages/admin/CreateTask.jsx

FIELDS (ALL REQUIRED):
┌─────────────────────────────────────────────────────────┐
│ 1. Title          text input, max 200 chars             │
│ 2. Description    textarea, min 3 rows                  │
│ 3. Priority       select: low / medium / high / urgent  │
│                   (show color-coded preview badge)      │
│ 4. Department     select: sales/marketing/inventory/    │
│                   production/quality/logistics/mgmt     │
│ 5. Assigned User  select: dynamically loads users       │
│                   filtered by chosen department         │
│ 6. Customer       4 sub-fields (1 required):            │
│                     • Customer Name (required)          │
│                     • Company (optional)                │
│                     • Email (optional)                  │
│                     • Phone (optional)                  │
│ 7. Selected Items dynamic list (min 1 item required):   │
│                     Each item has:                      │
│                     • Item Name (required)              │
│                     • Quantity (number, required)       │
│                     • Unit (text, default "pcs")        │
│                     • Notes (optional)                  │
│                     [+ Add Item] button below list      │
│ 8. Deadline       datetime-local input                  │
│                   (show "X days Y hours from now")      │
└─────────────────────────────────────────────────────────┘

UX BEHAVIORS:
  - When Department changes → immediately fetch users of that dept via
    GET /api/admin/users?department=<dept>&limit=100
    and repopulate the User dropdown
  - Priority field → live badge preview next to the select
  - Items section → add row on click, remove row with × button,
    min 1 row always present
  - Deadline → show human-readable countdown below field
    e.g. "⏰ Due in 3 days, 4 hours"
  - All validation client-side before submit (show inline red errors)
  - On submit → POST /api/tasks/
  - On success → react-hot-toast success + navigate to /admin/tasks
  - On error → show error toast + scroll to top

FORM LAYOUT (2-column on desktop, 1-column on mobile):
  Row 1: [Title (full width)]
  Row 2: [Description (full width)]
  Row 3: [Priority (half)] [Department (half)]
  Row 4: [Assigned User (full width — loads after dept selected)]
  Row 5: Customer Section (card with 4 sub-fields in 2×2 grid)
  Row 6: Selected Items Section (full width, dynamic rows)
  Row 7: [Deadline (half)] [Countdown display (half)]
  Row 8: [Cancel] [Create Task] buttons


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — DASHBOARD SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━ ADMIN DASHBOARD (GET /api/admin/dashboard) ━━

TOP ROW — 5 animated StatCards:
  • Total Users      (Users icon, slate)
  • Active Tasks     (ClipboardList, cyan)
  • In Progress      (Clock, amber)
  • Completed        (CheckCircle, green)
  • ⚠️ Overdue       (AlertCircle, red — pulse animation if > 0)

MIDDLE ROW — Charts (using recharts, already installed):
  Left (60%): Bar chart — Tasks per Department
    (bars colored by dept: cyan for sales, amber for marketing, etc.)
  Right (40%): Donut chart — Task Status Breakdown
    pending=slate, in_progress=cyan, forwarded=amber,
    completed=green, cancelled=red

TASK TRACKER TABLE:
  Columns: Title | Customer | Priority | Department | Current Holder |
           Status | Time Elapsed | Deadline | Action
  Features:
    - Filter bar: by status, department, priority, search
    - Color rows: red background if overdue
    - Priority badges: urgent=red, high=amber, medium=cyan, low=slate
    - Status badges with icons
    - "View Timeline" button per row → opens right-side drawer showing
      full forwardHistory as a vertical timeline
    - "Edit" button for pending tasks

FORWARD HISTORY DRAWER (TaskTimeline.jsx):
  Slide in from right (Framer Motion x: "100%" → 0)
  Shows each step:
    [Avatar] [Name] → [Avatar] [Name/Dept]  [time elapsed]  [note]
  Final step is "COMPLETED" (green check) or current holder
  Show total time elapsed at top: "⏱ 2 days, 4 hours total"

━━ USER DASHBOARD (GET /api/tasks/my) ━━

WELCOME BANNER:
  "Good morning, [Name] 👋"
  "[Department] Department — [X] tasks waiting"

TASK FILTER TABS:
  All | Pending | In Progress | Forwarded | Completed
  (tab underline animates with Framer Motion layoutId)

TASK CARDS (TaskCard.jsx):
  Each card shows:
    - Title (bold)
    - Priority badge (color-coded)
    - Customer name
    - Department badge
    - Deadline with countdown (red if < 24h)
    - Items count: "3 items"
    - Action buttons:
        If pending:     [▶ Start Task]
        If in_progress: [✅ Mark Complete] [→ Forward]
        If forwarded:   [▶ Accept & Start]
  
  Overdue tasks: red left border + pulsing animation

NOTIFICATION BELL (TopBar):
  Badge shows unread count
  Click → slide down panel with last 20 notifications
  "Mark all read" button at top

━━ SUPERADMIN DASHBOARD (GET /api/superadmin/dashboard) ━━

STATS ROW:
  Total Admins | Total Users | Total Tasks | Completion Rate % | Overdue Count

ADMIN MANAGEMENT TABLE:
  Columns: Admin Name | Email | Dept | Users | Tasks | Completed |
           Overdue | Status | Actions
  Actions: [Toggle Suspend/Activate]
  Row color: red-tinted if suspended

PLATFORM ANALYTICS:
  Bar chart: tasks per department (all admins combined)
  Bar chart: tasks per priority level
  Line chart: tasks created vs completed over last 30 days

RECENT ADMINS: last 5 created admins with quick stats


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — HEADER & SIDEBAR SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━ PUBLIC HEADER (components/Header.jsx — REWRITE) ━━

  Layout: sticky top, glassmorphism bg (bg-slate-950/80 backdrop-blur)
  Left: TaskFlow logo (Syne font, white + cyan dot)
  Center (desktop): Home | Features | How It Works | Login
  Right: [Login] (outlined) + [Get Started] (cyan filled)
  Mobile: hamburger menu → full-screen overlay nav

  Auth-aware: if user is logged in, show [Dashboard →] instead of Login/Get Started

━━ DASHBOARD SIDEBAR (components/common/Sidebar.jsx) ━━

  Width: 240px desktop, 0 (hidden) mobile with hamburger
  Top: TaskFlow logo + role badge ("ADMIN" / "SUPERADMIN" / "SALES")
  
  Navigation items by role:
  
  SuperAdmin:
    📊 Dashboard     → /superadmin/dashboard
    👥 Manage Admins → /superadmin/admins
    📋 All Tasks     → /superadmin/tasks
    ⚙️ Settings      → /superadmin/settings
  
  Admin:
    📊 Dashboard     → /admin/dashboard
    👥 My Users      → /admin/users
    ➕ Create User   → /admin/users/create
    📋 All Tasks     → /admin/tasks
    ➕ Create Task   → /admin/tasks/create
  
  User (sales/marketing/inventory):
    📊 Dashboard     → /user/dashboard
    📋 My Tasks      → /user/tasks

  Bottom: user avatar + name + email + [Logout] button

  Mobile: overlay drawer that slides in from left with ×  close button


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 14 — NOTIFICATION HOOK & POLLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE client/src/hooks/useNotifications.js:

```js
import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await API.get("/api/notifications");
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const markAllRead = useCallback(async () => {
    await API.patch("/api/notifications/mark-all-read");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30_000); // poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetch]);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetch };
}
```


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 15 — ENVIRONMENT & DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ server/.env (update existing) ━━━

```
PORT=8080
FRONTEND_URL=http://localhost:5173

MONGODB_URI=<your existing value>

RESEND_API=<your existing value>

# TIGHTEN THESE — existing values are insecure short strings
SECRET_KEY_ACCESS_TOKEN=<generate 64-char random string>
SECRET_KEY_REFRESH_TOKEN=<generate different 64-char random string>

CLODINARY_CLOUD_NAME=<your existing value>
CLODINARY_API_KEY=<your existing value>
CLODINARY_API_SECRET_KEY=<your existing value>
```

━━━ client/.env (CREATE) ━━━

```
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=TaskFlow
```

━━━ Additional packages to install ━━━

Server:
```bash
cd server && npm install express-rate-limit
```

Client:
```bash
cd client && npm install axios react-hot-toast
```
Note: framer-motion, lucide-react, recharts, react-router-dom are
already in client/package.json — just run `npm install`.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 16 — MOBILE RESPONSIVENESS RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply these Tailwind patterns consistently across ALL pages:

GRID LAYOUTS:
  Stat cards:  grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
  Feature grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  Form fields: grid-cols-1 md:grid-cols-2

DASHBOARD LAYOUT:
  Mobile: sidebar hidden → hamburger in TopBar → overlay drawer
  Tablet: sidebar hidden by default → hamburger → slide-in sidebar
  Desktop: sidebar always visible (240px) + main content

TYPOGRAPHY SCALING:
  Hero h1: text-4xl sm:text-5xl lg:text-7xl
  Section h2: text-2xl sm:text-3xl lg:text-4xl
  Body: text-sm sm:text-base

TOUCH TARGETS:
  All buttons: min-h-[44px] min-w-[44px] (Apple HIG standard)
  Task cards: generous padding (p-4 sm:p-5)
  Form inputs: h-12 on mobile (easier to tap)

TABLES:
  On mobile, transform tables into stacked card lists:
  Use: hidden md:table-cell for less important columns
  Show: title, status, deadline always
  Action buttons: icon-only on mobile with tooltips


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 17 — IMPLEMENTATION ORDER (follow this exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 — Fix existing + add models (backend)
  □ 1. Fix 4 bugs in existing code (Section 1)
  □ 2. Extend user.model.js (Section 2A)
  □ 3. Create task.model.js (Section 2B)
  □ 4. Create notification.model.js (Section 2C)

PHASE 2 — New middleware (backend)
  □ 5. Create roleGuard.js (Section 4A)
  □ 6. Create rateLimiter.js (Section 4B)
  □ 7. npm install express-rate-limit

PHASE 3 — New controllers (backend)
  □ 8.  Create admin.controllers.js (Section 5A)
  □ 9.  Create task.controllers.js (Section 5B)
  □ 10. Create superadmin.controllers.js (Section 5C)
  □ 11. Create notification.controllers.js (Section 5D)
  □ 12. Add getUserProfile to user.controllers.js

PHASE 4 — Routes + index.js (backend)
  □ 13. Create admin.route.js (Section 6B)
  □ 14. Create task.route.js (Section 6C)
  □ 15. Create superadmin.route.js (Section 6D)
  □ 16. Create notification.route.js (Section 6E)
  □ 17. Update server/index.js (Section 6F)
  □ 18. Run seed script → node server/scripts/seedSuperAdmin.js

PHASE 5 — Test backend with Postman/Thunder Client
  □ 19. Test: POST /api/user/login (superadmin@taskflow.com)
  □ 20. Test: GET /api/superadmin/dashboard
  □ 21. Test: POST /api/superadmin/admins (create admin)
  □ 22. Test: POST /api/admin/users (create user)
  □ 23. Test: POST /api/tasks (create task)
  □ 24. Test: PATCH /api/tasks/:id/start, /complete, /forward

PHASE 6 — Frontend foundation
  □ 25. npm install axios react-hot-toast (in client/)
  □ 26. Create client/.env
  □ 27. Create api/axios.js (Section 9A)
  □ 28. Create context/AuthContext.jsx (Section 9B)
  □ 29. Create components/common/ProtectedRoute.jsx (Section 9C)
  □ 30. Update routes/index.jsx (Section 9D)
  □ 31. Update App.jsx (Section 9E)
  □ 32. Create DashboardLayout.jsx
  □ 33. Update main.jsx (Section 9F)

PHASE 7 — Wire Login.jsx & Register.jsx to API
  □ 34. Login.jsx: call useAuth().login(email, password)
        On success → navigate to /dashboard (RoleRedirect handles routing)
        On error → show error toast
  □ 35. Register.jsx: call POST /api/user/register
        On success → show "Check your email" message
  □ 36. Add Forgot Password flow (use existing backend)

PHASE 8 — Dashboards
  □ 37. Create Sidebar.jsx + TopBar.jsx
  □ 38. Create StatCard.jsx, PriorityBadge.jsx, StatusBadge.jsx
  □ 39. Create AdminDashboard.jsx (Section 12)
  □ 40. Create UserDashboard.jsx
  □ 41. Create SuperAdminDashboard.jsx
  □ 42. Create ManageUsers.jsx + CreateUser.jsx
  □ 43. Create CreateTask.jsx (ALL 8 FIELDS — Section 11)
  □ 44. Create TaskTracker.jsx + TaskTimeline.jsx drawer
  □ 45. Create MyTasks.jsx + TaskDetail.jsx
  □ 46. Create ForwardTaskModal.jsx
  □ 47. Create NotificationPanel.jsx + useNotifications.js hook

PHASE 9 — Home Page
  □ 48. Add Syne + DM Sans fonts to index.html (Google Fonts)
  □ 49. Create HeroSection.jsx
  □ 50. Create FeaturesSection.jsx
  □ 51. Create HowItWorksSection.jsx
  □ 52. Create StatsSection.jsx
  □ 53. Create CTASection.jsx
  □ 54. Assemble in Home.jsx
  □ 55. Rewrite Header.jsx (Section 13)
  □ 56. Mobile pass on all pages

PHASE 10 — Polish
  □ 57. Add loading skeletons for all data-fetching states
  □ 58. Add empty states for tables/lists with zero data
  □ 59. Add error boundaries
  □ 60. Test on mobile viewport (375px, 390px, 414px)
  □ 61. Accessibility: aria-labels on icon buttons, focus styles
  □ 62. Final review: do all 8 task create fields validate + submit?


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 18 — SECURITY AUDIT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Already in place (keep):
  • bcryptjs password hashing (salt=10)
  • HTTP-only cookies for tokens
  • Helmet security headers
  • CORS restricted to FRONTEND_URL
  • Email verification flow
  • OTP-based password reset

🆕 Added in this architecture:
  • JWT now includes role in payload
  • Access token tightened: 5h → 15m
  • Role guard middleware (checks DB, not just JWT)
  • Rate limiting: 10 auth attempts per 15 min
  • Admin isolation: managedByAdmin filter on ALL admin queries
  • Soft delete (isDeleted flag) — never hard delete tasks
  • Input validation before DB writes in every controller
  • Token expiry error code for frontend auto-refresh

⚠️ Still TODO (do before production):
  • Strengthen JWT secrets (currently short strings in .env)
  • Set cookie secure:true when deploying with HTTPS
  • Set sameSite:"Lax" or "Strict" for same-origin deployment
  • Add Zod schema validation on all request bodies
  • Add request logging for audit trail
  • Set MongoDB Atlas IP whitelist
  • Never expose .env in Git (add server/.env to .gitignore)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF ARCHITECTURE PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This document is self-contained. Each section is independently
actionable. A developer or AI assistant can take any single section
and implement it without reading the others.
