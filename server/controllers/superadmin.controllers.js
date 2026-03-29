import UserModel from "../models/user.model.js";
import TaskModel from "../models/task.model.js";
import bcryptjs from "bcryptjs";

// ─── SuperAdmin: Create a new Admin ──────────────────────────────────────────
export async function createAdmin(request, response) {
  try {
    const { name, email, password, mobile, department, employeeId } = request.body;

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
      employeeId:   employeeId || undefined,
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
