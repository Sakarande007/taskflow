import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, UserPlus, X, ToggleRight, ToggleLeft } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";

const DEPTS = ["", "sales", "marketing", "inventory", "production", "quality", "logistics", "management"];

function CreateAdminModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", mobile: "", department: "", employeeId: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name     = "Name is required";
    if (!form.email.trim())   e.email    = "Email is required";
    if (!form.password || form.password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await API.post("/api/superadmin/admins", form);
      toast.success("Admin created successfully!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-900 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="font-bold text-slate-100" style={{ fontFamily:"'Syne',sans-serif" }}>Create Admin</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: "name",     label: "Full Name",  type: "text",     ph: "e.g. Rajesh Kumar",     req: true },
            { key: "email",    label: "Email",       type: "email",    ph: "admin@company.com",      req: true },
            { key: "password", label: "Password",   type: "password", ph: "Min 8 characters",       req: true },
            { key: "mobile",   label: "Mobile",      type: "text",     ph: "+91 98765 43210",         req: false },
            { key: "employeeId", label: "Employee ID", type: "text",     ph: "e.g. TF-ADMIN-001",      req: false },
          ].map(({ key, label, type, ph, req }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                {label} {req && <span className="text-red-400">*</span>}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={ph}
                className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-amber-500/60 transition-colors ${
                  errors[key] ? "border-red-500/50" : "border-slate-700 hover:border-slate-600"
                }`}
              />
              {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Department (optional)</label>
            <select
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none"
            >
              {DEPTS.map(d => <option key={d} value={d}>{d || "Choose department…"}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 rounded-xl text-sm font-bold transition-colors"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Create Admin</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ManageAdmins() {
  const [admins,  setAdmins]   = useState([]);
  const [loading, setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/superadmin/admins");
      setAdmins(res.data.data);
    } catch(e) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const toggleStatus = async (adminId) => {
    try {
      const res = await API.patch(`/api/superadmin/admins/${adminId}/toggle`);
      toast.success(res.data.message);
      fetchAdmins();
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed to toggle status");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            Manage Admins
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{admins.length} admin{admins.length !== 1 ? "s" : ""} registered on the platform</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-sm font-bold transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Create Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <Shield className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No admins yet</p>
              <button onClick={() => setShowModal(true)} className="mt-2 text-amber-400 text-xs hover:underline">
                Create the first admin →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Admin", "Email", "Department", "Users", "Tasks", "Completed", "Overdue", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {admins.map((admin, i) => (
                  <motion.tr
                    key={admin._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`hover:bg-slate-800/40 transition-colors ${admin.status === "Suspended" ? "bg-red-500/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {admin.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-slate-200 font-medium">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{admin.email}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">{admin.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{admin.userCount || 0}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{admin.taskStats?.total || 0}</td>
                    <td className="px-4 py-3 text-green-400 font-medium">{admin.taskStats?.completed || 0}</td>
                    <td className="px-4 py-3 text-red-400 font-medium">{admin.taskStats?.overdue || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        admin.status === "Active"
                          ? "bg-green-500/10 text-green-400 border-green-500/25"
                          : "bg-red-500/10 text-red-400 border-red-500/25"
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(admin._id)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 ${
                          admin.status === "Active"
                            ? "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/15"
                            : "border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/15"
                        }`}
                      >
                        {admin.status === "Active"
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Suspend</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Reinstate</>
                        }
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <CreateAdminModal
          onClose={() => setShowModal(false)}
          onCreated={fetchAdmins}
        />
      )}
    </div>
  );
}
