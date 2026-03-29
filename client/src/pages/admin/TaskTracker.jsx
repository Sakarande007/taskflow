import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, X, ArrowRight, Clock, User2 } from "lucide-react";
import API from "../../api/axios";
import { PriorityBadge, StatusBadge } from "../../components/common/Badges";
import toast from "react-hot-toast";

function isOverdue(task) {
  return !["completed","cancelled"].includes(task.status) && new Date(task.deadline) < new Date();
}
function timeElapsed(from) {
  const s = Math.floor((new Date() - new Date(from)) / 1000);
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

function TimelineDrawer({ task, onClose }) {
  if (!task) return null;
  const totalMs = task.completedAt
    ? new Date(task.completedAt) - new Date(task.createdAt)
    : new Date() - new Date(task.createdAt);
  const totalHrs = ((totalMs) / 3_600_000).toFixed(1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] z-50 flex flex-col bg-slate-900 border-l border-slate-800 overflow-y-auto"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-100 text-base">{task.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">⏱ {totalHrs}h total elapsed</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3">
          <StatusBadge status={task.status} />
          <span className="text-xs text-slate-500">
            Current holder: <span className="text-slate-300">{task.currentHolder?.name || "—"}</span>
          </span>
        </div>

        {/* Forward History Timeline */}
        <div className="flex-1 px-5 py-5">
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Forward History</h3>
          {task.forwardHistory?.length === 0 ? (
            <p className="text-sm text-slate-600 italic">No forwards yet — task is with the original assignee.</p>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-700" />
              {task.forwardHistory?.map((f, i) => (
                <div key={i} className="flex gap-4 items-start pl-8 relative">
                  <div className="absolute left-0 top-1.5 w-7 h-7 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-cyan-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-slate-800/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-300 font-medium">{f.fromUser?.name || "—"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-cyan-400 font-medium">{f.toUser?.name || f.toDepartment || "—"}</span>
                    </div>
                    {f.note && <p className="text-xs text-slate-500 mt-1.5 italic">"{f.note}"</p>}
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(f.forwardedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
              {/* Final state */}
              <div className="flex gap-4 items-start pl-8 relative">
                <div className={`absolute left-0 top-1.5 w-7 h-7 border rounded-full flex items-center justify-center ${
                  task.status === "completed"
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-slate-800 border-slate-700 text-slate-500"
                }`}>
                  {task.status === "completed" ? "✓" : "…"}
                </div>
                <div className="flex-1 bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                  <p className={`text-sm font-medium ${task.status === "completed" ? "text-green-400" : "text-slate-400"}`}>
                    {task.status === "completed" ? "✅ Task Completed" : `Currently with: ${task.currentHolder?.name || "—"}`}
                  </p>
                  {task.completedAt && (
                    <p className="text-xs text-slate-600 mt-0.5">{new Date(task.completedAt).toLocaleString("en-IN")}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TaskTracker() {
  const [tasks,    setTasks]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [dept,     setDept]     = useState("");
  const [priority, setPriority] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)   params.search   = search;
      if (status)   params.status   = status;
      if (dept)     params.department = dept;
      if (priority) params.priority  = priority;
      const res = await API.get("/api/tasks/admin/all", { params });
      setTasks(res.data.data);
      setTotal(res.data.pagination.total);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [page, status, dept, priority]);
  useEffect(() => {
    const t = setTimeout(() => fetchTasks(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openTimeline = async (taskId) => {
    try {
      const res = await API.get(`/api/tasks/admin/${taskId}`);
      setSelected(res.data.data);
    } catch(e) { toast.error("Failed to load timeline"); }
  };

  const STATUSES   = ["", "pending", "in_progress", "forwarded", "completed", "cancelled"];
  const DEPTS      = ["", "sales", "marketing", "inventory", "production", "quality", "logistics", "management"];
  const PRIORITIES = ["", "low", "medium", "high", "urgent"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>Task Tracker</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} total tasks</p>
        </div>
        <button
          onClick={() => navigate("/admin/tasks/create")}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none flex-1"
          />
        </div>
        {[
          { val: status,   set: setStatus,   opts: STATUSES,   label: "All Status" },
          { val: dept,     set: setDept,     opts: DEPTS,      label: "All Dept" },
          { val: priority, set: setPriority, opts: PRIORITIES,  label: "All Priority" },
        ].map(({ val, set, opts, label }) => (
          <select key={label} value={val} onChange={e => set(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none min-w-[130px]">
            {opts.map(o => <option key={o} value={o}>{o || label}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <PlusCircle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No tasks found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Title","Customer","Priority","Dept","Holder","Status","Elapsed","Deadline","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tasks.map((task, i) => (
                  <motion.tr
                    key={task._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`hover:bg-slate-800/40 transition-colors ${isOverdue(task) ? "bg-red-500/5" : ""}`}
                  >
                    <td className={`px-4 py-3 max-w-[180px] ${isOverdue(task) ? "border-l-2 border-red-500" : ""}`}>
                      <span className="font-medium text-slate-200 truncate block">{task.title}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{task.customer?.name}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">{task.department}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                      {task.currentHolder ? (
                        <div className="flex items-center gap-1.5">
                          <User2 className="w-3.5 h-3.5 text-slate-600" />
                          {task.currentHolder.name}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{timeElapsed(task.createdAt)}</td>
                    <td className={`px-4 py-3 text-xs hidden md:table-cell ${isOverdue(task) ? "text-red-400 font-semibold" : "text-slate-400"}`}>
                      {new Date(task.deadline).toLocaleDateString("en-IN")}
                      {isOverdue(task) && " ⚠️"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openTimeline(task._id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded-lg border border-slate-700 hover:border-cyan-500/40 transition-all"
                      >
                        Timeline <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {total > 15 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">Showing {((page-1)*15)+1}–{Math.min(page*15, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors">Previous</button>
              <button disabled={page*15 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Drawer */}
      {selected && <TimelineDrawer task={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
