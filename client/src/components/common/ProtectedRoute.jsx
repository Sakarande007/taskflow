import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Spinner shown while session is being restored
function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
    </div>
  );
}

// Role → default dashboard mapping
const ROLE_HOME = {
  superadmin: "/superadmin/dashboard",
  admin:      "/admin/dashboard",
  sales:      "/user/dashboard",
  marketing:  "/user/dashboard",
  inventory:  "/user/dashboard",
  user:       "/user/dashboard",
};

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // User is logged in but wrong role — redirect to their home
    return <Navigate to={ROLE_HOME[user?.role] || "/"} replace />;
  }

  return children;
}

// Used on /dashboard to auto-redirect to correct dashboard after login
export function RoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading)          return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user?.role] || "/"} replace />;
}
