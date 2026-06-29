import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, CheckCircle2, Send, Package, Clock, ArrowRight, User2
} from "lucide-react";
import API from "../../api/axios";
import { PriorityBadge, StatusBadge } from "../../components/common/Badges";
import toast from "react-hot-toast";

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate   = useNavigate();
  const [task, setTask]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(false);
  const [fwdForm, setFwdForm] = useState({ toUserId: "", toDepartment: "", note: "" });

  const fetchTask = async () => {
    try {
      const res = await API.get(`/api/tasks/${taskId}`);
      setTask(res.data.data);
    } catch(e) {
      toast.error("Task not found");
      navigate("/user/tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [taskId]);

  const handleStart = async () => {
    await API.patch(`/api/tasks/${taskId}/start`);
    toast.success("Task started!");
    fetchTask();
  };

  const handleComplete = async () => {
    await API.patch(`/api/tasks/${taskId}/complete`);
    toast.success("Task marked as completed!");
    navigate("/user/dashboard");
  };

  const handleForward = async (e) => {
    e.preventDefault();
    if (!fwdForm.toUserId && !fwdForm.toDepartment) {
      toast.error("Provide a user ID or department to forward to");
      return;
    }
    try {
      await API.post(`/api/tasks/${taskId}/forward`, fwdForm);
      toast.success("Task forwarded!");
      navigate("/user/dashboard");
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to forward");
    }
  };

  const DEPARTMENTS = ["sales","marketing","inventory","production","quality","logistics","management"];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!task) return null;

  const overdue = !["completed","cancelled"].includes(task.status) && new Date(task.deadline) < new Date();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>{task.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {overdue && <span className="text-xs text-red-400 font-semibold">⚠️ Overdue</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Description</h2>
        <p className="text-slate-300 text-sm leading-relaxed">{task.description}</p>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-xs font-mono text-slate-500 mb-2">Customer</h3>
          <p className="text-slate-200 font-medium">{task.customer?.name}</p>
          {task.customer?.company && <p className="text-xs text-slate-500">{task.customer.company}</p>}
          {task.customer?.phone   && <p className="text-xs text-slate-500">{task.customer.phone}</p>}
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <h3 className="text-xs font-mono text-slate-500 mb-2">Deadline</h3>
          <p className={`font-medium text-sm ${overdue ? "text-red-400" : "text-slate-200"}`}>
            {new Date(task.deadline).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Dept: <span className="capitalize">{task.department}</span></p>
        </div>
      </div>

      {/* Selected items */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" /> Items ({task.selectedItems?.length})
        </h2>
        <div className="space-y-2">
          {task.selectedItems?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
              <span className="text-sm text-slate-200">{item.itemName}</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                {item.quantity} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Forward History */}
      {task.forwardHistory?.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Forward History</h2>
          <div className="space-y-3">
            {task.forwardHistory.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-xs text-cyan-400 font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">{f.fromUser?.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-cyan-400">{f.toUser?.name || f.toDepartment}</span>
                  </div>
                  {f.note && <p className="text-xs text-slate-500 italic mt-0.5">"{f.note}"</p>}
                  <p className="text-xs text-slate-600">{new Date(f.forwardedAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Panel */}
      {!["completed","cancelled"].includes(task.status) && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {task.status === "pending" && (
              <button onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 rounded-lg text-sm font-semibold border border-cyan-500/30 transition-colors">
                <Play className="w-4 h-4" /> Start Task
              </button>
            )}
            {task.status === "in_progress" && (
              <button onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-sm font-semibold border border-green-500/30 transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Mark Complete
              </button>
            )}
            {task.status === "forwarded" && (
              <button onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg text-sm font-semibold border border-blue-500/30 transition-colors">
                <Play className="w-4 h-4" /> Accept & Start
              </button>
            )}
          </div>

          {/* Forward form */}
          {["in_progress","pending"].includes(task.status) && !forwarding && (
            <button
              onClick={() => setForwarding(true)}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Forward to another department
            </button>
          )}

          {forwarding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleForward}
              className="mt-3 space-y-3 border-t border-slate-800 pt-4"
            >
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Forward to Department</label>
                <select
                  value={fwdForm.toDepartment}
                  onChange={e => setFwdForm(f => ({ ...f, toDepartment: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                >
                  <option value="">Choose department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Note (optional)</label>
                <textarea
                  value={fwdForm.note}
                  onChange={e => setFwdForm(f => ({ ...f, note: e.target.value }))}
                  rows={2}
                  placeholder="Add a handoff note…"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForwarding(false)} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/30 transition-colors">
                  <Send className="w-3.5 h-3.5" /> Forward Task
                </button>
              </div>
            </motion.form>
          )}
        </div>
      )}
    </div>
  );
}
