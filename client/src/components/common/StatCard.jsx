import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, color = "cyan", suffix = "", pulse = false }) {
  const colorMap = {
    cyan:   { border: "border-cyan-500/30",   icon: "text-cyan-400",   bg: "bg-cyan-500/10"   },
    amber:  { border: "border-amber-500/30",  icon: "text-amber-400",  bg: "bg-amber-500/10"  },
    green:  { border: "border-green-500/30",  icon: "text-green-400",  bg: "bg-green-500/10"  },
    red:    { border: "border-red-500/30",    icon: "text-red-400",    bg: "bg-red-500/10"    },
    purple: { border: "border-purple-500/30", icon: "text-purple-400", bg: "bg-purple-500/10" },
    slate:  { border: "border-slate-600/30",  icon: "text-slate-400",  bg: "bg-slate-700/30"  },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-slate-900 rounded-xl border ${c.border} p-5 overflow-hidden`}
    >
      {/* pulse ring for urgent items */}
      {pulse && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-100">
            {value}<span className="text-lg text-slate-400 ml-1">{suffix}</span>
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
}
