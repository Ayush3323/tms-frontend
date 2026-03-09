// components/AuthGuards.jsx
import { Navigate } from "react-router-dom";

// 1. Use this for Login page
export function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

// 2. Use this for Dashboard/Admin pages
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    // No token? Kick them out to login!
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}