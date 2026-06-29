import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ROLE_HOME = {
  superadmin: "/superadmin/dashboard",
  admin:      "/admin/dashboard",
  sales:      "/user/dashboard",
  marketing:  "/user/dashboard",
  inventory:  "/user/dashboard",
  user:       "/user/dashboard",
};

function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(ROLE_HOME[user.role] || "/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 text-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Please sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 pl-10 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 px-8 text-sm font-medium text-white transition-all hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer / Register Link */}
          <div className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
              Register here
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Login;
