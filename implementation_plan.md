# TaskFlow — Complete Architecture Implementation Plan

## Overview

Building a full-stack **Manufacturing Task Management System** on top of an existing React + Node.js scaffold. The architecture defines 10 phases with 62 implementation steps covering backend bug fixes, new models/controllers/routes, and a full frontend from routing to dashboards.

**Existing codebase state:**
- ✅ Server: Express + MongoDB + JWT auth (login/register/logout/email-verify/OTP)
- ✅ Client: React 19 + Vite + Tailwind v4 + Framer Motion scaffold with Login.jsx, Register.jsx, Header, Footer, basic routes
- ❌ No role-based system, no tasks, no admin/superadmin, no dashboard pages

---

## User Review Required

> [!IMPORTANT]
> The architecture tightens `accessToken` expiry from **5h → 15m**. This means the frontend **must** implement the token refresh interceptor (Section 9A) correctly, or users will be logged out every 15 minutes. The `axios.js` interceptor handles this automatically.

> [!WARNING]
> The existing `user.model.js` has `role: enum ["employee","admin","customer"]`. The new schema replaces this with `["superadmin","admin","sales","marketing","inventory","user"]`. **Any existing demo users in MongoDB will have stale roles** and must be re-seeded or manually updated.

> [!NOTE]
> The architecture instructs running a **seed script** (`node server/scripts/seedSuperAdmin.js`) once after Phase 4 to create the superadmin account (`superadmin@taskflow.com` / `SuperAdmin@123`). This must be done before testing the frontend login.

---

## Proposed Changes

### PHASE 1 — Bug Fixes + New Models (Backend)

---

#### [MODIFY] [auth.js](file:///d:/react/taskflow/server/middleware/auth.js)
- Fix: `request.header.authorization` → `request.headers?.authorization`
- Fix: Add `request.userRole = decode.role` attachment
- Fix: Add `TOKEN_EXPIRED` error code for frontend auto-refresh

#### [MODIFY] [generatedAccessToken.js](file:///d:/react/taskflow/server/Utils/generatedAccessToken.js)
- Fix: Include `role` in JWT payload → `{ id: userId, role: user.role }`
- Fix: Tighten expiry from `5h` → `15m`

#### [MODIFY] [user.controllers.js](file:///d:/react/taskflow/server/controllers/user.controllers.js)
- Fix BUG 3: `findOne({ email, verify_email: false })` → `findOne({ email })`
- Fix BUG 4: `clearCookie("accesstoken")` → `clearCookie("accessToken")` (capital T)
- Add: `getUserProfile` export function

#### [MODIFY] [user.model.js](file:///d:/react/taskflow/server/models/user.model.js)
- Replace `role` enum with `["superadmin","admin","sales","marketing","inventory","user"]`
- Add new fields: `department` (enum), `createdByAdmin`, `managedByAdmin`, `employeeId`, `isActive`

#### [NEW] [task.model.js](file:///d:/react/taskflow/server/models/task.model.js)
- Full task schema with sub-schemas: `taskItemSchema`, `forwardEntrySchema`
- Fields: title, description, priority, department, assignedTo, customer, selectedItems, deadline, status, currentHolder, forwardHistory, isDeleted, timestamps
- Virtuals: `hoursElapsed`, `isOverdue`
- Indexes for fast dashboard queries

#### [NEW] [notification.model.js](file:///d:/react/taskflow/server/models/notification.model.js)
- Fields: recipient, sender, task, type, title, message, isRead, readAt
- Index on `{ recipient, isRead, createdAt }`

---

### PHASE 2 — New Middleware (Backend)

---

#### [NEW] [roleGuard.js](file:///d:/react/taskflow/server/middleware/roleGuard.js)
- `roleGuard(allowedRoles)` middleware factory — checks DB for role + isActive
- Exports: `isSuperAdmin`, `isAdmin`, `isAnyUser` convenience shortcuts

#### [NEW] [rateLimiter.js](file:///d:/react/taskflow/server/middleware/rateLimiter.js)
- `authLimiter`: 10 attempts / 15 min window
- `apiLimiter`: 120 requests / 1 min window
- Install: `express-rate-limit`

---

### PHASE 3 — New Controllers (Backend)

---

#### [NEW] [admin.controllers.js](file:///d:/react/taskflow/server/controllers/admin.controllers.js)
- `adminCreateUser` — create sales/marketing/inventory/user roles
- `adminGetMyUsers` — paginated, filtered list of managed users
- `adminUpdateUser` — update user (no privileged roles)
- `adminDeactivateUser` — soft deactivate
- `adminDashboardStats` — 9-parallel-query stats + department breakdown + recent tasks

#### [NEW] [task.controllers.js](file:///d:/react/taskflow/server/controllers/task.controllers.js)
- `createTask` — admin creates task with 8 required fields
- `adminGetAllTasks` — paginated, filtered (status/dept/priority/overdue)
- `adminGetTaskTimeline` — single task with full forward history
- `adminUpdateTask` — edit pending task
- `userGetMyTasks` — tasks where currentHolder = me
- `userStartTask` — pending → in_progress
- `userCompleteTask` — in_progress → completed (notifies admin)
- `userForwardTask` — moves task to next user/department (full audit log)
- `userGetTaskDetail` — single task for user

#### [NEW] [superadmin.controllers.js](file:///d:/react/taskflow/server/controllers/superadmin.controllers.js)
- `createAdmin` — superadmin creates admin accounts
- `getAllAdmins` — all admins with user count + task stats
- `toggleAdminStatus` — suspend/reinstate admin
- `superAdminDashboard` — platform-wide 8-parallel-query analytics

#### [NEW] [notification.controllers.js](file:///d:/react/taskflow/server/controllers/notification.controllers.js)
- `getNotifications` — paginated + unread count
- `markAllRead` — bulk mark
- `markOneRead` — individual mark

---

### PHASE 4 — Routes + Index (Backend)

---

#### [MODIFY] [user.route.js](file:///d:/react/taskflow/server/route/user.route.js)
- Add `GET /profile` → auth + getUserProfile
- Add `authLimiter` to `/login` and `/register`

#### [NEW] [admin.route.js](file:///d:/react/taskflow/server/route/admin.route.js)
#### [NEW] [task.route.js](file:///d:/react/taskflow/server/route/task.route.js)
#### [NEW] [superadmin.route.js](file:///d:/react/taskflow/server/route/superadmin.route.js)
#### [NEW] [notification.route.js](file:///d:/react/taskflow/server/route/notification.route.js)

#### [MODIFY] [index.js](file:///d:/react/taskflow/server/index.js)
- Import + register all 4 new routers
- Add global `apiLimiter` middleware

#### [NEW] [seedSuperAdmin.js](file:///d:/react/taskflow/server/scripts/seedSuperAdmin.js)
- Run once to create `superadmin@taskflow.com` / `SuperAdmin@123`

---

### PHASE 5 — Frontend Foundation

---

#### [NEW] `client/.env`
- `VITE_API_URL=http://localhost:8080`

#### [NEW] [axios.js](file:///d:/react/taskflow/client/src/api/axios.js)
- Axios instance with base URL + credentials
- Request interceptor: attach `tf_access_token` from localStorage
- Response interceptor: auto-refresh on 401 + `TOKEN_EXPIRED` code

#### [NEW] [AuthContext.jsx](file:///d:/react/taskflow/client/src/context/AuthContext.jsx)
- `AuthProvider` with `useReducer` — `SET_USER`, `LOGOUT`, `DONE`
- On mount: restore session via `GET /api/user/profile`
- `login()`, `logout()` callbacks

#### [NEW] [ProtectedRoute.jsx](file:///d:/react/taskflow/client/src/components/common/ProtectedRoute.jsx)
- `ProtectedRoute` — guards by role, shows spinner while loading
- `RoleRedirect` — auto-redirects after login to role-appropriate dashboard

#### [NEW] [DashboardLayout.jsx](file:///d:/react/taskflow/client/src/components/common/DashboardLayout.jsx)
- Sidebar + TopBar persistent layout for all dashboard pages

#### [MODIFY] [routes/index.jsx](file:///d:/react/taskflow/client/src/routes/index.jsx)
- Full router rewrite with public routes + protected dashboard routes (grouped by role)

#### [MODIFY] [App.jsx](file:///d:/react/taskflow/client/src/App.jsx)
- Slim down to public layout only (Header + Outlet + Footer)

#### [MODIFY] [main.jsx](file:///d:/react/taskflow/client/src/main.jsx)
- Wrap with `AuthProvider` + add `react-hot-toast Toaster`

---

### PHASE 6 — Dashboard Components

---

#### [NEW] [Sidebar.jsx](file:///d:/react/taskflow/client/src/components/common/Sidebar.jsx)
- Role-aware nav links, mobile overlay drawer, user info + logout

#### [NEW] [TopBar.jsx](file:///d:/react/taskflow/client/src/components/common/TopBar.jsx)
- Notification bell with unread badge, avatar, mobile hamburger

#### [NEW] Common: `StatCard.jsx`, `PriorityBadge.jsx`, `StatusBadge.jsx`, `NotificationPanel.jsx`

#### [NEW] Task components: `TaskCard.jsx`, `TaskTimeline.jsx`, `ForwardTaskModal.jsx`

#### [NEW] Dashboard pages: `AdminDashboard.jsx`, `UserDashboard.jsx`, `SuperAdminDashboard.jsx`

#### [NEW] Admin pages: `ManageUsers.jsx`, `CreateUser.jsx`, `CreateTask.jsx` (all 8 fields), `TaskTracker.jsx`

#### [NEW] User pages: `MyTasks.jsx`, `TaskDetail.jsx`

#### [NEW] Hook: `useNotifications.js` — 30s polling, mark read

---

### PHASE 7 — Home Page Redesign

---

#### [MODIFY] [Home.jsx](file:///d:/react/taskflow/client/src/pages/Home.jsx)
- Full redesign — "Industrial Precision" aesthetic
- Sections: Hero, StatsBar, Features (glassmorphism cards), HowItWorks (animated timeline), Dashboard Preview (3 role cards), CTA, Footer

#### [MODIFY] [Header.jsx](file:///d:/react/taskflow/client/src/components/Header.jsx)
- Glassmorphism sticky nav, auth-aware (Dashboard → if logged in), mobile hamburger

#### [MODIFY] `client/index.html`
- Add Syne + DM Sans Google Fonts

#### [MODIFY] `client/src/index.css`
- CSS variables for design system (colors, typography tokens)

---

## Open Questions

> [!IMPORTANT]
> **Do you want to wire Login.jsx/Register.jsx to the API (Phase 7) in this pass?** The existing Login/Register UIs are already built — should I connect them to `AuthContext` and the backend, or leave them as-is for now?

> [!NOTE]
> The architecture specifies adding `authLimiter` (10 req/15 min) to login/register routes. This could block testing during development. Should I set a higher limit for dev, or apply it as-is?

---

## Verification Plan

### Automated Tests
1. Start server: `cd server && npm run dev`
2. Run seed: `node server/scripts/seedSuperAdmin.js`
3. Test via API client:
   - `POST /api/user/login` → superadmin creds → get token
   - `GET /api/superadmin/dashboard` → verify 200
   - `POST /api/superadmin/admins` → create admin
   - `POST /api/admin/users` → create user
   - `POST /api/tasks` → create task
   - `PATCH /api/tasks/:id/start` + `/complete` + `/forward`
4. Start client: `cd client && npm run dev`
5. Navigate to `http://localhost:5173` → verify home page loads
6. Login → verify redirect to correct role dashboard
7. Admin: create user → create task → verify notification
8. User: start task → complete task → verify admin notification

### Manual Verification
- Test on 375px viewport for mobile responsiveness
- Verify notification bell polling (30s interval)
- Confirm TaskTracker timeline drawer animation
- Verify overdue task red highlighting
