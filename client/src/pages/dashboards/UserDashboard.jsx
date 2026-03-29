import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Play, ArrowRight, Package } from "lucide-react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { PriorityBadge, StatusBadge } from "../../components/common/Badges";
import toast from "react-hot-toast";

const TABS = ["all","pending","in_progress","forwarded","completed"];
const TAB_LABELS = { all:"All", pending:"Pending", in_progress:"In Progress", forwarded:"Forwarded", completed:"Completed" };

function CountdownBadge({ deadline }) {
  const ms   = new Date(deadline) - new Date();
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(hrs / 24);
  if (ms < 0) return <span className="text-xs text-red-400 font-semibold">⚠️ Overdue</span>;
  if (hrs < 24) return <span className="text-xs text-amber-400 font-semibold">⏰ {hrs}h left</span>;
  return <span className="text-xs text-slate-500">{days}d left</span>;
}

export default function UserDashboard() {
  const [tasks,   setTasks]   = useState([]);
  const [tab,     setTab]     = useState("all");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = async (status) => {
    setLoading(true);
    try {
      const params = status === "all" ? {} : { status };
      const res = await API.get("/api/tasks/my", { params });
      setTasks(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(tab); }, [tab]);

  const handleStart = async (taskId) => {
    try {
      await API.patch(`/api/tasks/${taskId}/start`);
      toast.success("Task started!");
      fetchTasks(tab);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to start task");
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await API.patch(`/api/tasks/${taskId}/complete`);
      toast.success("Task marked as completed!");
      fetchTasks(tab);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to complete task");
    }
  };

  const pendingCount = tasks.filter(t => t.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 to-cyan-900/20 rounded-xl border border-cyan-500/20 p-5"
      >
        <p className="text-xs font-mono text-cyan-500/70 uppercase tracking-widest mb-1">{user?.department} Department</p>
        <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]} 👋
        </h1>
        {pendingCount > 0 && (
          <p className="text-sm text-slate-400 mt-1">
            You have <span className="text-amber-400 font-semibold">{pendingCount} task{pendingCount > 1 ? "s" : ""}</span> waiting for you.
          </p>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t ? "text-slate-100" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === t && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">{TAB_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* Task Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-600 bg-slate-900 rounded-xl border border-slate-800">
          <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No tasks in this category</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task, i) => {
              const overdue = !["completed","cancelled"].includes(task.status) && new Date(task.deadline) < new Date();
              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-slate-900 rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-lg hover:shadow-slate-950/50 ${
                    overdue ? "border-red-500/40 animate-pulse-slow" : "border-slate-800"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-100 text-sm leading-snug flex-1">{task.title}</h3>
                    <PriorityBadge priority={task.priority} />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full capitalize">{task.department}</span>
                  </div>

                  {/* Customer */}
                  <p className="text-xs text-slate-500">
                    Customer: <span className="text-slate-400">{task.customer?.name}</span>
                  </p>

                  {/* Items count */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Package className="w-3.5 h-3.5" />
                    <span>{task.selectedItems?.length || 0} item{task.selectedItems?.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(task.deadline).toLocaleDateString("en-IN")}</span>
                    </div>
                    <CountdownBadge deadline={task.deadline} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800">
                    {task.status === "pending" && (
                      <button
                        onClick={() => handleStart(task._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 rounded-lg text-xs font-semibold transition-colors border border-cyan-500/30"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Task
                      </button>
                    )}
                    {task.status === "in_progress" && (
                      <>
                        <button
                          onClick={() => handleComplete(task._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-xs font-semibold transition-colors border border-green-500/30"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button
                          onClick={() => navigate(`/user/tasks/${task._id}`)}
                          className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded-lg text-xs font-semibold transition-colors border border-amber-500/30"
                        >
                          → Forward
                        </button>
                      </>
                    )}
                    {(task.status === "forwarded") && (
                      <button
                        onClick={() => handleStart(task._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg text-xs font-semibold transition-colors border border-blue-500/30"
                      >
                        <Play className="w-3.5 h-3.5" /> Accept &amp; Start
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/user/tasks/${task._id}`)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
