import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, UserPlus, ClipboardList, PlusCircle,
  LogOut, X, ChevronRight, Zap
} from "lucide-react";

const NAV_ITEMS = {
  superadmin: [
    { to: "/superadmin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/superadmin/admins",    icon: Users,            label: "Manage Admins" },
  ],
  admin: [
    { to: "/admin/dashboard",      icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users",          icon: Users,           label: "My Users" },
    { to: "/admin/users/create",   icon: UserPlus,        label: "Create User" },
    { to: "/admin/tasks",          icon: ClipboardList,   label: "All Tasks" },
    { to: "/admin/tasks/create",   icon: PlusCircle,      label: "Create Task" },
  ],
  user: [
    { to: "/user/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
    { to: "/user/tasks",           icon: ClipboardList,   label: "My Tasks" },
  ],
};

const ROLE_BADGE_COLOR = {
  superadmin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin:      "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  sales:      "bg-purple-500/20 text-purple-400 border-purple-500/30",
  marketing:  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  inventory:  "bg-green-500/20 text-green-400 border-green-500/30",
  user:       "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function Sidebar({ role, user, isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const navItems   = NAV_ITEMS[role] || NAV_ITEMS.user;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            TaskFlow
          </span>
        </div>
        {/* Mobile close button */}
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4">
        <span className={`text-xs font-mono px-2 py-1 rounded border uppercase tracking-widest ${ROLE_BADGE_COLOR[role] || ROLE_BADGE_COLOR.user}`}>
          {role || "user"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-cyan-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.name} className="w-9 h-9 rounded-full object-cover border-2 border-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile overlay drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-64 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
