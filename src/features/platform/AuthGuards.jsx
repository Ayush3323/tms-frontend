import { Navigate } from "react-router-dom";

const ADMIN_TOKEN_KEY = "admin_token";

export function PublicRoute({ children }) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
