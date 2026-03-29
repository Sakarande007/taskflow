import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, ShieldCheck, ClipboardList, RefreshCw, LayoutDashboard,
  Bell, Smartphone, ChevronDown, Zap
} from "lucide-react";

// ── Animated count-up hook ─────────────────────────────────────
function useCountUp(target, duration = 2000) {
  return target; // returns static for simplicity; animates via framer
}

// ── Section: Hero ──────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grid-bg">
      {/* Background blurs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        {/* Left */}
        <div className="lg:col-span-3 space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-sm text-cyan-400 tracking-widest"
          >
            // MANUFACTURING TASK SYSTEM v2.0
          </motion.p>

          <div className="space-y-2">
            {["Engineer Your", "Workflow."].map((word, i) => (
              <motion.h1
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.15, duration: 0.6 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {i === 1 ? (
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{word}</span>
                ) : word}
              </motion.h1>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-lg max-w-xl leading-relaxed"
          >
            TaskFlow gives manufacturing teams total visibility — from task creation through department handoffs to final delivery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white rounded-lg font-medium text-sm transition-all duration-200"
            >
              Watch Demo <ChevronDown className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {["06b6d4","f59e0b","8b5cf6","10b981","ef4444"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: `#${c}` }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">Trusted by <span className="text-slate-300 font-medium">50+ manufacturing teams</span></p>
          </motion.div>
        </div>

        {/* Right — Floating Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="lg:col-span-2 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl"
            style={{
              transform: "rotate(-3deg)",
              boxShadow: "0 0 60px rgba(6,182,212,0.12), 0 20px 60px rgba(0,0,0,0.5)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-slate-500">#TASK-2047</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">⚡ urgent</span>
            </div>
            <h3 className="font-bold text-slate-100 mb-1">Steel Frame Assembly — Q4 Order</h3>
            <p className="text-xs text-slate-500 mb-3">Customer: Bharat Industries Pvt Ltd</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
              </div>
              <span className="text-xs text-cyan-400 font-mono">65%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>🏭 Production Dept</span>
              <span>⏰ Due in 2d 4h</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
              <button className="flex-1 py-1.5 bg-cyan-500/15 text-cyan-400 rounded-lg text-xs font-semibold border border-cyan-500/30">▶ Continue</button>
              <button className="flex-1 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs border border-slate-700">→ Forward</button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Section: Stats Bar ─────────────────────────────────────────
function StatsSection() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true });
  const stats = [
    { value: "3",         label: "Role Dashboards" },
    { value: "6+",        label: "Department Roles" },
    { value: "100%",      label: "Task Audit Trail" },
    { value: "Real-time", label: "Notifications" },
  ];
  return (
    <div ref={ref} className="border-y border-slate-800 bg-slate-900/50">
      <div className="container mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map(({ value, label }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.12 }}
          >
            <p className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Features ──────────────────────────────────────────
const FEATURES = [
  { icon: ShieldCheck,  title: "Role-Based Access Control",   desc: "SuperAdmin controls Admins. Admins control their team only. Zero overlap." },
  { icon: ClipboardList, title: "Smart Task Creation",        desc: "8 required fields capture everything: customer, items, quantities, deadline." },
  { icon: RefreshCw,    title: "Department Forwarding",       desc: "Users forward tasks to next department. Full chain is logged forever." },
  { icon: LayoutDashboard, title: "Real-Time Admin Dashboard", desc: "Watch tasks move through departments with time-elapsed tracking." },
  { icon: Bell,         title: "Instant Notifications",       desc: "Every action — assigned, started, forwarded, completed — triggers an alert." },
  { icon: Smartphone,   title: "Mobile-First Design",         desc: "Works seamlessly on phones on the factory floor, no zoom required." },
];

function FeaturesSection() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section className="py-24 container mx-auto px-6" ref={ref}>
      <div className="text-center mb-14">
        <span className="font-mono text-xs text-cyan-500 uppercase tracking-widest">// Features</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          Everything your factory floor needs
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-6 hover:border-cyan-500/25 transition-all duration-300 group"
          >
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
              <Icon className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Section: How It Works ──────────────────────────────────────
const STEPS = [
  {
    icon: ClipboardList, color: "cyan",
    title: "Admin Creates Task",
    desc: "Fill in title, description, priority, department, assigned user, customer info, item quantities, and deadline. All fields required."
  },
  {
    icon: Bell, color: "amber",
    title: "User Receives Task",
    desc: "Instant notification. The task appears in the user's dashboard with all context — no back-and-forth needed."
  },
  {
    icon: ArrowRight, color: "cyan",
    title: "Work & Forward",
    desc: "User works on the task, then marks complete or forwards to the next department with a note. The admin sees every move in real-time."
  },
  {
    icon: LayoutDashboard, color: "amber",
    title: "Admin Sees Everything",
    desc: "Track which department holds the task, how long each step took, and get notified the instant it's done."
  },
];

function HowItWorksSection() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-24 bg-slate-900/30 border-y border-slate-800" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <span className="font-mono text-xs text-amber-500 uppercase tracking-widest">// Process</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            From assignment to delivery
          </h2>
          <p className="text-slate-500 mt-2">Four simple steps, complete visibility</p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-cyan-500 via-amber-500 to-cyan-500 origin-top hidden sm:block"
          />

          <div className="space-y-8">
            {STEPS.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.2 }}
                className="flex items-start gap-6 sm:px-12"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 ${
                  color === "cyan" ? "bg-cyan-500/15 border-cyan-500/40" : "bg-amber-500/15 border-amber-500/40"
                }`}>
                  <Icon className={`w-5 h-5 ${color === "cyan" ? "text-cyan-400" : "text-amber-400"}`} />
                </div>
                <div className="flex-1 glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-mono ${color === "cyan" ? "text-cyan-500" : "text-amber-500"}`}>0{i + 1}</span>
                    <h3 className="font-semibold text-slate-100">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: Dashboard Preview ─────────────────────────────────
const DASHBOARDS = [
  {
    role: "SuperAdmin", badge: null,
    borderColor: "border-amber-500/30", accentColor: "text-amber-400",
    desc: "God-mode access. Create admins, view all tasks, monitor platform health.",
    features: ["Create Admins", "Platform Analytics", "Suspend Users", "Global Task View"],
  },
  {
    role: "Admin", badge: "Most Used",
    borderColor: "border-cyan-500/40", accentColor: "text-cyan-400",
    desc: "Your command center. Manage your team, create tasks, track every step.",
    features: ["Create Users", "Create Tasks (8 fields)", "Real-Time Tracker", "Department Analytics"],
    featured: true,
  },
  {
    role: "User", badge: null,
    borderColor: "border-slate-600/30", accentColor: "text-slate-400",
    desc: "Clean, focused task view. Start, complete, or forward tasks with one click.",
    features: ["My Task Queue", "Start/Complete Actions", "Forward to Dept", "Notification Center"],
  },
];

function DashboardPreviewSection() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section className="py-24 container mx-auto px-6" ref={ref}>
      <div className="text-center mb-14">
        <span className="font-mono text-xs text-cyan-500 uppercase tracking-widest">// Dashboards</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2" style={{ fontFamily: "'Syne', sans-serif" }}>
          Three dashboards. Zero confusion.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {DASHBOARDS.map(({ role, badge, borderColor, accentColor, desc, features, featured }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15 }}
            className={`rounded-xl border p-6 flex flex-col glass-card ${borderColor} ${featured ? "ring-1 ring-cyan-500/20 shadow-xl shadow-cyan-500/5" : ""}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`font-bold text-xl ${accentColor}`} style={{ fontFamily: "'Syne', sans-serif" }}>{role}</h3>
              {badge && (
                <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{desc}</p>
            <ul className="space-y-2">
              {features.map((f, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${accentColor.replace("text-", "bg-")}`} />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Section: CTA ───────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-24 container mx-auto px-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-cyan-950/20 p-10 sm:p-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-transparent pointer-events-none" />
        <span className="font-mono text-xs text-cyan-500 uppercase tracking-widest">// Get Started</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Ready to streamline your manufacturing workflow?
        </h2>
        <p className="text-slate-400 mb-8">Join 50+ manufacturing teams using TaskFlow.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold transition-colors shadow-lg shadow-cyan-500/20"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg font-medium transition-colors"
          >
            Schedule a Demo
          </a>
        </div>
        <p className="text-xs text-slate-600 mt-5">No credit card required • Setup in 5 minutes</p>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function HomeFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/30">
      <div className="container mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <span className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>TaskFlow</span>
              <p className="text-xs text-slate-600">Built for manufacturing. Designed for clarity.</p>
            </div>
          </div>
          <nav className="flex gap-5">
            {[["Home","/"],["Features","#features"],["Login","/login"],["Register","/register"]].map(([label, href]) => (
              <Link key={label} to={href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-slate-800/50">
          <p className="text-xs text-slate-600">© 2025 TaskFlow. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Home Page ──────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-[#060d1f] text-slate-100">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <CTASection />
      <HomeFooter />
    </div>
  );
}
