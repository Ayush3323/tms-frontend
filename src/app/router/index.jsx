import { BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import AdminLoginPage from "../../features/auth/pages/AdminLoginPage";
import ProtectedRoute from "./ProtectedRoute";

function AdminDashboard() {
  return <h1>Platform Admin Dashboard</h1>;
}

function Router() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirect to login */}
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

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