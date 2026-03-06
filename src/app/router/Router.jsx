import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../../features/platform/pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "../../features/platform/pages/AdminDashboard";
  
function Router() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect to login */}
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;