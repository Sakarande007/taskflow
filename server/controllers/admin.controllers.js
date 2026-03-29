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
