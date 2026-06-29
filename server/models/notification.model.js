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
