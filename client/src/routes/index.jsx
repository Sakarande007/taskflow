import { createBrowserRouter } from "react-router-dom";
import App              from "../App.jsx";
import DashboardLayout  from "../components/common/DashboardLayout.jsx";
import { ProtectedRoute, RoleRedirect } from "../components/common/ProtectedRoute.jsx";

// Public pages
import Home     from "../pages/Home.jsx";
import Login    from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";

// Dashboards
import SuperAdminDashboard from "../pages/dashboards/SuperAdminDashboard.jsx";
import AdminDashboard      from "../pages/dashboards/AdminDashboard.jsx";
import UserDashboard       from "../pages/dashboards/UserDashboard.jsx";

// SuperAdmin pages
import ManageAdmins from "../pages/superadmin/ManageAdmins.jsx";

// Admin pages
import ManageUsers from "../pages/admin/ManageUsers.jsx";
import CreateUser  from "../pages/admin/CreateUser.jsx";
import CreateTask  from "../pages/admin/CreateTask.jsx";
import TaskTracker from "../pages/admin/TaskTracker.jsx";

// User pages
import MyTasks    from "../pages/user/MyTasks.jsx";
import TaskDetail from "../pages/user/TaskDetail.jsx";

const ADMIN_ROLES = ["admin", "superadmin"];
const ALL_ROLES   = ["superadmin", "admin", "sales", "marketing", "inventory", "user"];

const router = createBrowserRouter([
  // ── Public layout (Header + Footer) ───────────────────────────────────
  {
    path: "/",
    element: <App />,
    children: [
      { index: true,       element: <Home /> },
      { path: "login",     element: <Login /> },
      { path: "register",  element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "dashboard", element: <RoleRedirect /> },
    ],
  },

  // ── Dashboard layout (Sidebar + TopBar) ───────────────────────────────
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      // ── SuperAdmin ────────────────────────────────────────────────────
      {
        path: "superadmin/dashboard",
        element: <ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminDashboard /></ProtectedRoute>,
      },
      {
        path: "superadmin/admins",
        element: <ProtectedRoute allowedRoles={["superadmin"]}><ManageAdmins /></ProtectedRoute>,
      },

      // ── Admin ─────────────────────────────────────────────────────────
      {
        path: "admin/dashboard",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>,
      },
      {
        path: "admin/users",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><ManageUsers /></ProtectedRoute>,
      },
      {
        path: "admin/users/create",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateUser /></ProtectedRoute>,
      },
      {
        path: "admin/tasks/create",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><CreateTask /></ProtectedRoute>,
      },
      {
        path: "admin/tasks",
        element: <ProtectedRoute allowedRoles={ADMIN_ROLES}><TaskTracker /></ProtectedRoute>,
      },

      // ── User (all roles) ──────────────────────────────────────────────
      {
        path: "user/dashboard",
        element: <ProtectedRoute allowedRoles={ALL_ROLES}><UserDashboard /></ProtectedRoute>,
      },
      {
        path: "user/tasks",
        element: <ProtectedRoute allowedRoles={ALL_ROLES}><MyTasks /></ProtectedRoute>,
      },
      {
        path: "user/tasks/:taskId",
        element: <ProtectedRoute allowedRoles={ALL_ROLES}><TaskDetail /></ProtectedRoute>,
      },
    ],
  },
]);

export default router;
