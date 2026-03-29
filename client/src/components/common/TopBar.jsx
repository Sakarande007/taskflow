import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";

export default function TopBar({ user, onMenuToggle }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page context / greeting */}
        <div className="hidden lg:block">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notification Bell */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="w-8 h-8 rounded-full object-cover border-2 border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-slate-300">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Notification Panel Drawer */}
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
