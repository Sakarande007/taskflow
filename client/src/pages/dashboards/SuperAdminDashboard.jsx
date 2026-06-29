import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users, ClipboardList, CheckCircle2, AlertCircle,
  TrendingUp, Shield, ToggleLeft, ToggleRight, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import API from "../../api/axios";
import StatCard from "../../components/common/StatCard";

const PRIORITY_COLORS = { urgent:"#ef4444", high:"#f59e0b", medium:"#06b6d4", low:"#64748b" };

export default function SuperAdminDashboard() {
  const [stats,  setStats]   = useState(null);
  const [admins, setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [dashRes, adminsRes] = await Promise.all([
        API.get("/api/superadmin/dashboard"),
        API.get("/api/superadmin/admins"),
      ]);
      setStats(dashRes.data.data);
      setAdmins(adminsRes.data.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStatus = async (adminId) => {
    await API.patch(`/api/superadmin/admins/${adminId}/toggle`);
    fetchData();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const deptData  = (stats?.tasksByDept || []).map(d => ({ name: d._id, Tasks: d.total, fill: "#06b6d4" }));
  const prioData  = (stats?.tasksByPriority || []).map(p => ({ name: p._id, count: p.count, fill: PRIORITY_COLORS[p._id] || "#64748b" }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-mono text-xs text-amber-400 uppercase tracking-widest">// SuperAdmin Control Panel</span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Platform Overview
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Admins"   value={stats?.totalAdmins || 0}    icon={Shield}       color="amber" />
        <StatCard label="Total Users"    value={stats?.totalUsers || 0}     icon={Users}        color="cyan" />
        <StatCard label="Total Tasks"    value={stats?.totalTasks || 0}     icon={ClipboardList} color="slate" />
        <StatCard label="Completed"      value={stats?.completedTasks || 0}  icon={CheckCircle2} color="green" />
        <StatCard
          label="Overdue"
          value={stats?.overdueTasks || 0}
          icon={AlertCircle}
          color="red"
          pulse={stats?.overdueTasks > 0}
        />
      </div>

      {/* Completion rate banner */}
      <div className="bg-gradient-to-r from-amber-900/30 to-transparent border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
        <Activity className="w-8 h-8 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-mono text-amber-500/70 uppercase tracking-wider">Platform Completion Rate</p>
          <p className="text-3xl font-bold text-amber-400">{stats?.completionRate || 0}%</p>
        </div>
        <div className="flex-1 ml-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats?.completionRate || 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Tasks by Department
          </h2>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} margin={{ left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="Tasks" radius={[4,4,0,0]}>
                  {deptData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-600 text-sm text-center py-16">No data</p>}
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Tasks by Priority</h2>
          {prioData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={prioData} margin={{ left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {prioData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-600 text-sm text-center py-16">No data</p>}
        </div>
      </div>

      {/* Admin Management Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Admin Management
          </h2>
        </div>
        <div className="overflow-x-auto">
          {admins.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Admin", "Email", "Dept", "Users", "Tasks", "Completed", "Overdue", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {admins.map(admin => (
                  <motion.tr
                    key={admin._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-slate-800/40 transition-colors ${admin.status === "Suspended" ? "bg-red-500/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                          {admin.name?.charAt(0)}
                        </div>
                        <span className="text-slate-200 font-medium">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{admin.email}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{admin.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{admin.userCount}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{admin.taskStats?.total || 0}</td>
                    <td className="px-4 py-3 text-green-400 font-medium">{admin.taskStats?.completed || 0}</td>
                    <td className="px-4 py-3 text-red-400 font-medium">{admin.taskStats?.overdue || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        admin.status === "Active"
                          ? "bg-green-500/15 text-green-400 border-green-500/30"
                          : "bg-red-500/15 text-red-400 border-red-500/30"
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(admin._id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 hover:opacity-80"
                        style={admin.status === "Active"
                          ? { borderColor: "#ef444440", color: "#f87171", background: "rgba(239,68,68,0.1)" }
                          : { borderColor: "#10b98140", color: "#34d399", background: "rgba(16,185,129,0.1)" }}
                      >
                        {admin.status === "Active"
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Suspend</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Reinstate</>
                        }
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <Shield className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No admins created yet</p>
              <p className="text-slate-600 text-xs mt-1">Use the API or seed script to create the first admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
