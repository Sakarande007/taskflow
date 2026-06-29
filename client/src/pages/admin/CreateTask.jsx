import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PlusCircle, Trash2, Clock } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { PriorityBadge } from "../../components/common/Badges";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const DEPTS = ["sales", "marketing", "inventory", "production", "quality", "logistics", "management"];

function countdownText(deadline) {
  if (!deadline) return null;
  const ms   = new Date(deadline) - new Date();
  if (ms <= 0) return { text: "Deadline has passed!", color: "text-red-400" };
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(hrs / 24);
  const remH = hrs % 24;
  return {
    text: `⏰ Due in ${days > 0 ? `${days}d ` : ""}${remH}h`,
    color: hrs < 24 ? "text-red-400" : hrs < 72 ? "text-amber-400" : "text-cyan-400"
  };
}

export default function CreateTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", department: "",
    assignedTo: "",
    customer: { name: "", company: "", email: "", phone: "" },
    selectedItems: [{ itemName: "", quantity: 1, unit: "pcs", notes: "" }],
    deadline: "",
  });

  // When department changes — fetch users of that department
  useEffect(() => {
    if (!form.department) { setAvailableUsers([]); return; }
    setUsersLoading(true);
    API.get("/api/admin/users", { params: { department: form.department, limit: 100 } })
      .then(r => setAvailableUsers(r.data.data))
      .catch(() => setAvailableUsers([]))
      .finally(() => setUsersLoading(false));
    setForm(f => ({ ...f, assignedTo: "" }));
  }, [form.department]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setCust  = (key, val) => setForm(f => ({ ...f, customer: { ...f.customer, [key]: val } }));

  const addItem = () => setForm(f => ({
    ...f,
    selectedItems: [...f.selectedItems, { itemName: "", quantity: 1, unit: "pcs", notes: "" }]
  }));
  const removeItem = (i) => {
    if (form.selectedItems.length <= 1) return;
    setForm(f => ({ ...f, selectedItems: f.selectedItems.filter((_, idx) => idx !== i) }));
  };
  const setItem = (i, key, val) => {
    const items = [...form.selectedItems];
    items[i] = { ...items[i], [key]: val };
    setField("selectedItems", items);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())        e.title       = "Title is required";
    if (!form.description.trim())  e.description = "Description is required";
    if (!form.priority)            e.priority    = "Priority is required";
    if (!form.department)          e.department  = "Department is required";
    if (!form.assignedTo)          e.assignedTo  = "Please select a user";
    if (!form.customer.name.trim()) e.customerName = "Customer name is required";
    if (!form.deadline)            e.deadline    = "Deadline is required";
    else if (new Date(form.deadline) <= new Date()) e.deadline = "Deadline must be a future date";
    const badItems = form.selectedItems.some(it => !it.itemName.trim() || it.quantity < 1);
    if (badItems) e.items = "All items must have a name and quantity ≥ 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setLoading(true);
    try {
      await API.post("/api/tasks", form);
      toast.success("Task created successfully!");
      navigate("/admin/tasks");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const countdown = countdownText(form.deadline);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/tasks")} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>Create Task</h1>
          <p className="text-sm text-slate-400">Fill all 8 required fields to create a task</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* 1 — Title */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider text-cyan-400">01 — Task Details</h2>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              value={form.title}
              onChange={e => setField("title", e.target.value)}
              maxLength={200}
              placeholder="Enter task title…"
              className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan-500 ${errors.title ? "border-red-500/50" : "border-slate-700"}`}
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Description <span className="text-red-400">*</span></label>
            <textarea
              value={form.description}
              onChange={e => setField("description", e.target.value)}
              rows={3}
              placeholder="Describe the task in detail…"
              className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan-500 resize-none ${errors.description ? "border-red-500/50" : "border-slate-700"}`}
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Priority <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-2">
                <select
                  value={form.priority}
                  onChange={e => setField("priority", e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none"
                >
                  {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
                <PriorityBadge priority={form.priority} />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Department <span className="text-red-400">*</span></label>
              <select
                value={form.department}
                onChange={e => setField("department", e.target.value)}
                className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none ${errors.department ? "border-red-500/50" : "border-slate-700"}`}
              >
                <option value="">Choose department…</option>
                {DEPTS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
              {errors.department && <p className="text-xs text-red-400 mt-1">{errors.department}</p>}
            </div>
          </div>

          {/* Assigned User */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Assign To <span className="text-red-400">*</span></label>
            <select
              value={form.assignedTo}
              onChange={e => setField("assignedTo", e.target.value)}
              disabled={!form.department || usersLoading}
              className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none disabled:opacity-50 ${errors.assignedTo ? "border-red-500/50" : "border-slate-700"}`}
            >
              <option value="">{!form.department ? "Select a department first…" : usersLoading ? "Loading users…" : availableUsers.length === 0 ? "No users in this department" : "Choose user…"}</option>
              {availableUsers.map(u => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
            </select>
            {errors.assignedTo && <p className="text-xs text-red-400 mt-1">{errors.assignedTo}</p>}
          </div>
        </div>

        {/* Customer */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-amber-400">02 — Customer Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Customer Name <span className="text-red-400">*</span></label>
              <input
                value={form.customer.name}
                onChange={e => setCust("name", e.target.value)}
                placeholder="e.g. Ramesh Industries"
                className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-cyan-500 ${errors.customerName ? "border-red-500/50" : "border-slate-700"}`}
              />
              {errors.customerName && <p className="text-xs text-red-400 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Company</label>
              <input value={form.customer.company} onChange={e => setCust("company", e.target.value)} placeholder="Company name (optional)" className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Email</label>
              <input type="email" value={form.customer.email} onChange={e => setCust("email", e.target.value)} placeholder="customer@email.com" className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Phone</label>
              <input value={form.customer.phone} onChange={e => setCust("phone", e.target.value)} placeholder="+91 98765 43210" className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
            </div>
          </div>
        </div>

        {/* Selected Items */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-green-400">03 — Selected Items</h2>
          {errors.items && <p className="text-xs text-red-400 mb-2">{errors.items}</p>}
          {form.selectedItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-12 gap-2 items-start"
            >
              <div className="col-span-4">
                {i === 0 && <label className="text-xs text-slate-500 block mb-1.5">Item Name *</label>}
                <input
                  value={item.itemName}
                  onChange={e => setItem(i, "itemName", e.target.value)}
                  placeholder="Item name"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="text-xs text-slate-500 block mb-1.5">Qty *</label>}
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => setItem(i, "quantity", Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <div className="col-span-2">
                {i === 0 && <label className="text-xs text-slate-500 block mb-1.5">Unit</label>}
                <input
                  value={item.unit}
                  onChange={e => setItem(i, "unit", e.target.value)}
                  placeholder="pcs"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="col-span-3">
                {i === 0 && <label className="text-xs text-slate-500 block mb-1.5">Notes</label>}
                <input
                  value={item.notes}
                  onChange={e => setItem(i, "notes", e.target.value)}
                  placeholder="Optional notes"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="col-span-1 flex items-end pb-0.5">
                {i === 0 && <div className="mb-1.5 h-4" />}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={form.selectedItems.length <= 1}
                  className="p-2 text-slate-600 hover:text-red-400 disabled:opacity-20 transition-colors w-full flex justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Deadline */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-purple-400 mb-4">04 — Deadline</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Deadline Date &amp; Time <span className="text-red-400">*</span></label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={e => setField("deadline", e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={`w-full bg-slate-800 border text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none [color-scheme:dark] ${errors.deadline ? "border-red-500/50" : "border-slate-700"}`}
              />
              {errors.deadline && <p className="text-xs text-red-400 mt-1">{errors.deadline}</p>}
            </div>
            {countdown && (
              <div className="flex items-center gap-2 pt-6">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className={`text-sm font-semibold ${countdown.color}`}>{countdown.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate("/admin/tasks")}
            className="flex-1 py-3 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-slate-950 rounded-xl text-sm font-bold transition-colors"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              : <><PlusCircle className="w-4 h-4" /> Create Task</>
            }
          </button>
        </div>
      </motion.form>
    </div>
  );
}
