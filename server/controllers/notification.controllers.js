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
