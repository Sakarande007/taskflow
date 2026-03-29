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
