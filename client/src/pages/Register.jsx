import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, User, ChevronDown, AlertCircle } from "lucide-react";
import API from "../api/axios";
import toast from "react-hot-toast";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await API.post("/api/user/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      toast.success(res.data.message || "Registration successful! Please check your email to verify your account.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  // Shared tailwind classes for inputs and select to ensure consistency
  const inputClasses = "flex h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 pl-10 text-sm ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-100";
  const labelClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
  return (
    <>
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="my-8 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Get started with our platform today
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className={labelClasses}>
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className={labelClasses}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>
          </div>

           {/* Role Dropdown */}
           <div className="space-y-2">
            <label htmlFor="role" className={labelClasses}>
              I am a...
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-500 z-10" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                // Added 'appearance-none' to hide default browser arrow so we can use our own
                className={`${inputClasses} appearance-none pr-10 cursor-pointer`}
                required
              >
                <option value="user">Standard User</option>
                <option value="creator">Content Creator</option>
                <option value="business">Business Account</option>
              </select>
               {/* Custom dropdown arrow on the right */}
              <ChevronDown className="absolute right-3 top-3 h-5 w-5 text-slate-500 pointer-events-none" />
            </div>
          </div>


          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className={labelClasses}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={inputClasses}
                minLength={8}
                required
              />
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className={labelClasses}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>
          </div>

          {/* Error Message Area */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-950/50 border border-red-900 p-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4"/>
                {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-indigo-600 to-pink-600 px-8 text-sm font-medium text-white transition-all hover:from-indigo-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 mt-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
            {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <a
            href="/login" // Update this route as needed
            className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
          >
            Login here
          </a>
        </div>
      </motion.div>
    </div>
    </>
  )
}

export default Register
