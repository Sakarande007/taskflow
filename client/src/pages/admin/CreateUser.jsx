import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, ArrowLeft } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";

const ROLES = ["sales", "marketing", "inventory", "user"];
const DEPTS = ["sales", "marketing", "inventory", "production", "quality", "logistics", "management"];

export default function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "sales",
    department: "sales", mobile: "", employeeId: ""
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.email.trim())    e.email    = "Email is required";
    if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!form.role)            e.role       = "Role is required";
    if (!form.department)      e.department  = "Department is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await API.post("/api/admin/users", form);
      toast.success("User created successfully!");
      navigate("/admin/users");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", opts = {}) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan-500 transition-colors ${
          errors[key] ? "border-red-500/50" : "border-slate-700 hover:border-slate-600"
        }`}
        {...opts}
      />
      {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/users")} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>Create User</h1>
          <p className="text-sm text-slate-400">Add a new team member under your management</p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4"
      >
        {field("name", "Full Name", "text", { placeholder: "e.g. Ravi Kumar" })}
        {field("email", "Email Address", "email", { placeholder: "ravi@company.com" })}
        {field("password", "Temporary Password", "password", { placeholder: "Min 8 characters" })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role <span className="text-red-400">*</span></label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            {errors.role && <p className="text-xs text-red-400 mt-1">{errors.role}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Department <span className="text-red-400">*</span></label>
            <select
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {DEPTS.map(d => <option key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
            {errors.department && <p className="text-xs text-red-400 mt-1">{errors.department}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("mobile", "Mobile (optional)", "text", { placeholder: "+91 98765 43210" })}
          {field("employeeId", "Employee ID (optional)", "text", { placeholder: "EMP-001" })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-slate-950 rounded-lg text-sm font-bold transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <><UserPlus className="w-4 h-4" /> Create User</>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
