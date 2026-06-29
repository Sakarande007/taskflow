import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, KeyRound, AlertCircle } from "lucide-react";
import API from "../api/axios";
import toast from "react-hot-toast";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email");
    setLoading(true);
    setError("");
    try {
      const res = await API.put("/api/user/forgot-password", { email });
      toast.success(res.data.message || "OTP sent to your email!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setError("Please enter the OTP");
    setLoading(true);
    setError("");
    try {
      const res = await API.put("/api/user/verify-forgot-password-otp", { email, otp });
      toast.success(res.data.message || "OTP verified!");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.put("/api/user/reset-password", {
        email,
        newPassword,
        confirmPassword
      });
      toast.success(res.data.message || "Password reset successful!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "flex h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 text-slate-100 disabled:opacity-50";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-8 text-center text-slate-100">
          <h2 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            {step === 1 && "Reset Password"}
            {step === 2 && "Enter OTP"}
            {step === 3 && "New Password"}
          </h2>
          <p className="text-sm text-slate-400">
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && `Code sent to ${email}`}
            {step === 3 && "Secure your account with a new password"}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-950/50 border border-red-900 p-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" onSubmit={handleSendOtp} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={inputClasses}
                  required
                />
              </div>
              <button disabled={loading} className="w-full flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {loading ? "Sending..." : "Send OTP"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form key="step2" onSubmit={handleVerifyOtp} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); setError(""); }}
                  className={inputClasses}
                  required
                />
              </div>
              <button disabled={loading} className="w-full flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {loading ? "Verifying..." : "Verify OTP"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form key="step3" onSubmit={handleResetPassword} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  className={inputClasses}
                  required
                  minLength={8}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  className={inputClasses}
                  required
                  minLength={8}
                />
              </div>
              <button disabled={loading} className="w-full flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
            Login here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
