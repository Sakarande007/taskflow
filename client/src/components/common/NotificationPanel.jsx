import { useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { X, Bell, Check, CheckCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_COLORS = {
  task_assigned:  "bg-cyan-500",
  task_started:   "bg-blue-500",
  task_forwarded: "bg-amber-500",
  task_completed: "bg-green-500",
  task_overdue:   "bg-red-500",
  user_created:   "bg-purple-500",
  system:         "bg-slate-500",
};

function timeAgo(date) {
  const secs = Math.floor((new Date() - new Date(date)) / 1000);
  if (secs < 60)    return "just now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, unreadCount, loading, markAllRead } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-slate-100">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Bell className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-5 py-4 transition-colors ${!n.isRead ? "bg-slate-800/50" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[n.type] || "bg-slate-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.isRead ? "text-slate-100" : "text-slate-400"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span className="text-xs text-slate-600">{timeAgo(n.createdAt)}</span>
                          </div>
                        </div>
                        {!n.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
