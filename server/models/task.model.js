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
