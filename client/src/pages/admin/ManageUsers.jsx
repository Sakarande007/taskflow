import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Search, Filter, ToggleRight, ToggleLeft } from "lucide-react";
import API from "../../api/axios";
import toast from "react-hot-toast";

const ROLES = ["", "sales", "marketing", "inventory", "user"];
const DEPTS = ["", "sales", "marketing", "inventory", "production", "quality", "logistics", "management"];

export default function ManageUsers() {
  const [users,  setUsers]  = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [role,   setRole]   = useState("");
  const [dept,   setDept]   = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (role)   params.role   = role;
      if (dept)   params.department = dept;
      const res = await API.get("/api/admin/users", { params });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
    } catch(e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, role, dept]);
  useEffect(() => {
    const debounce = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(debounce);
  }, [search]);

  const toggleActive = async (userId, isActive) => {
    try {
      await API.put(`/api/admin/users/${userId}`, { isActive: !isActive, status: !isActive ? "Active" : "Inactive" });
      toast.success(isActive ? "User deactivated" : "User reactivated");
      fetchUsers();
    } catch(e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Syne', sans-serif" }}>
            My Users
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} total users under your management</p>
        </div>
        <button
          onClick={() => navigate("/admin/users/create")}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none flex-1 min-w-0"
          />
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none min-w-[130px]"
        >
          {ROLES.map(r => <option key={r} value={r}>{r || "All Roles"}</option>)}
        </select>
        <select
          value={dept}
          onChange={e => setDept(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none min-w-[160px]"
        >
          {DEPTS.map(d => <option key={d} value={d}>{d || "All Departments"}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <UserPlus className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No users found</p>
              <button onClick={() => navigate("/admin/users/create")} className="mt-2 text-cyan-400 text-xs hover:underline">
                Create a user →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Name", "Email", "Role", "Department", "Emp ID", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((u, i) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="text-slate-200 font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">{u.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden lg:table-cell">{u.employeeId || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        u.isActive
                          ? "bg-green-500/10 text-green-400 border-green-500/25"
                          : "bg-red-500/10 text-red-400 border-red-500/25"
                      }`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u._id, u.isActive)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                          u.isActive
                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}
                      >
                        {u.isActive
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Deactivate</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Reactivate</>
                        }
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">Showing {((page-1)*15)+1}–{Math.min(page*15, total)} of {total}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page * 15 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
