import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, ClipboardList, Clock, CheckCircle2, AlertCircle,
  UserPlus, PlusCircle, ArrowRight, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import API from "../../api/axios";
import StatCard from "../../components/common/StatCard";
import { PriorityBadge, StatusBadge } from "../../components/common/Badges";
import { useAuth } from "../../context/AuthContext";

const DEPT_COLORS = {
  sales: "#06b6d4", marketing: "#f59e0b", inventory: "#8b5cf6",
  production: "#10b981", quality: "#ef4444", logistics: "#f97316", management: "#64748b"
};
const STATUS_COLORS = {
  pending: "#64748b", in_progress: "#06b6d4", forwarded: "#f59e0b",
  completed: "#10b981", cancelled: "#ef4444"
};

function timeElapsed(createdAt) {
  const secs = Math.floor((new Date() - new Date(createdAt)) / 1000);
  if (secs < 3600)  return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function isOverdue(task) {
  return !["completed","cancelled"].includes(task.status) && new Date(task.deadline) < new Date();
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/api/admin/dashboard")
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const taskStatusData = stats ? [
    { name: "Pending",     value: stats.tasks.pending,    fill: STATUS_COLORS.pending },
    { name: "In Progress", value: stats.tasks.inProgress, fill: STATUS_COLORS.in_progress },
    { name: "Completed",   value: stats.tasks.completed,  fill: STATUS_COLORS.completed },
    { name: "Overdue",     value: stats.tasks.overdue,    fill: STATUS_COLORS.cancelled },
  ] : [];

  const deptData = (stats?.departmentBreakdown || []).map(d => ({
    name: d._id, Total: d.total, Completed: d.completed,
    fill: DEPT_COLORS[d._id] || "#64748b"
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back, <span className="text-cyan-400">{user?.name}</span></p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/users/create")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
          <button
            onClick={() => navigate("/admin/tasks/create")}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users"  value={stats?.users.total || 0}     icon={Users}         color="slate" />
        <StatCard label="Active Tasks"  value={stats?.tasks.total || 0}     icon={ClipboardList} color="cyan" />
        <StatCard label="In Progress"   value={stats?.tasks.inProgress || 0} icon={Clock}        color="amber" />
        <StatCard label="Completed"     value={stats?.tasks.completed || 0}  icon={CheckCircle2} color="green" />
        <StatCard
          label="Overdue"
          value={stats?.tasks.overdue || 0}
          icon={AlertCircle}
          color="red"
          pulse={stats?.tasks.overdue > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart — Tasks by Dept */}
        <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Tasks by Department
          </h2>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Bar dataKey="Total" fill="#06b6d4" radius={[4,4,0,0]} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-600 text-sm">No tasks yet</div>
          )}
        </div>

        {/* Donut Chart — Status */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Task Status Breakdown</h2>
          {stats?.tasks.total > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {taskStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-600 text-sm">No tasks yet</div>
          )}
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            Recent Tasks
          </h2>
          <button
            onClick={() => navigate("/admin/tasks")}
            className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {stats?.recentTasks?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Title", "Priority", "Department", "Holder", "Status", "Elapsed", "Deadline"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.recentTasks.map(task => (
                  <motion.tr
                    key={task._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-slate-800/50 transition-colors ${isOverdue(task) ? "bg-red-500/5 border-l-2 border-red-500" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">{task.title}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{task.department}</td>
                    <td className="px-4 py-3 text-slate-400">{task.currentHolder?.name || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3 text-slate-400">{timeElapsed(task.createdAt)}</td>
                    <td className={`px-4 py-3 text-xs ${isOverdue(task) ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                      {new Date(task.deadline).toLocaleDateString("en-IN")}
                      {isOverdue(task) && " ⚠️"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No tasks yet</p>
              <button
                onClick={() => navigate("/admin/tasks/create")}
                className="mt-3 text-cyan-400 hover:underline text-sm"
              >
                Create your first task →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
