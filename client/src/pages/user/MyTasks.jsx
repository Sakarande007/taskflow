// MyTasks.jsx — User's full task list (same as UserDashboard but as a standalone page)
import { useNavigate } from "react-router-dom";
import UserDashboard from "../dashboards/UserDashboard.jsx";

// MyTasks re-uses the UserDashboard component for consistency
export default function MyTasks() {
  return <UserDashboard />;
}
