import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, ArrowRight } from "lucide-react";

const ROLE_HOME = {
  superadmin: "/superadmin/dashboard",
  admin:      "/admin/dashboard",
  sales:      "/user/dashboard",
  marketing:  "/user/dashboard",
  inventory:  "/user/dashboard",
  user:       "/user/dashboard",
};

const NAV_LINKS = [
  { label: "Home",          href: "/" },
  { label: "Features",      href: "/#features" },
  { label: "How It Works",  href: "/#how-it-works" },
];

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="container mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-bold text-white text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
            Task<span className="text-cyan-400">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={ROLE_HOME[user?.role] || "/dashboard"}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold transition-colors"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">
                Login
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold transition-colors"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="container mx-auto px-5 py-4 space-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 px-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    to={ROLE_HOME[user?.role] || "/dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-cyan-500 text-slate-950 rounded-lg text-sm font-bold"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2.5 text-center border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition-colors">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="py-2.5 text-center bg-cyan-500 text-slate-950 rounded-lg text-sm font-bold">
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
