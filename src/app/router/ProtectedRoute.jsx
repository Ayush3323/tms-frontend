import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("tms_access_token");
  const userType = localStorage.getItem("tms_user_type");

  if (!token || userType !== "platform_admin") {
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default ProtectedRoute;