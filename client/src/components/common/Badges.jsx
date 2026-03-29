export function PriorityBadge({ priority }) {
  const map = {
    urgent: "bg-red-500/20 text-red-400 border-red-500/40",
    high:   "bg-amber-500/20 text-amber-400 border-amber-500/40",
    medium: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    low:    "bg-slate-700/40 text-slate-400 border-slate-600/40",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide ${map[priority] || map.low}`}>
      {priority === "urgent" && "⚡ "}
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending:     "bg-slate-700/40 text-slate-400 border-slate-600/40",
    in_progress: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    forwarded:   "bg-amber-500/20 text-amber-400 border-amber-500/40",
    completed:   "bg-green-500/20 text-green-400 border-green-500/40",
    cancelled:   "bg-red-500/20 text-red-400 border-red-500/40",
  };
  const labels = {
    pending:     "⏳ Pending",
    in_progress: "🔄 In Progress",
    forwarded:   "→ Forwarded",
    completed:   "✅ Completed",
    cancelled:   "✕ Cancelled",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  );
}
