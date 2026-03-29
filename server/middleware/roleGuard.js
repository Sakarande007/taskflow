import UserModel from "../models/user.model.js";

/**
 * Usage:
 *   router.get("/route", auth, roleGuard("admin"), handler)
 *   router.get("/route", auth, roleGuard(["admin","superadmin"]), handler)
 */
export const roleGuard = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request, response, next) => {
    try {
      // request.userRole is set by auth.js — but double-check from DB
      const user = await UserModel.findById(request.userId).select(
        "role status isActive"
      );

      if (!user) {
        return response
          .status(404)
          .json({ message: "User not found", error: true, success: false });
      }
      if (!user.isActive || user.status !== "Active") {
        return response.status(403).json({
          message: "Account is suspended or inactive",
          error: true,
          success: false,
        });
      }
      if (!roles.includes(user.role)) {
        return response.status(403).json({
          message: `Access denied. Required role: ${roles.join(" or ")}`,
          error: true,
          success: false,
        });
      }

      request.userDoc = user; // attach full doc for controllers
      next();
    } catch (error) {
      return response
        .status(500)
        .json({ message: error.message, error: true, success: false });
    }
  };
};

// Convenience shortcuts
export const isSuperAdmin = roleGuard("superadmin");
export const isAdmin      = roleGuard(["admin", "superadmin"]);
export const isAnyUser    = roleGuard([
  "superadmin", "admin", "sales", "marketing", "inventory", "user",
]);
