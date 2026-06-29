import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/api/notifications");
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // Silently fail — don't break the UI if notifications error
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await API.patch("/api/notifications/mark-all-read");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000); // poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications };
}
