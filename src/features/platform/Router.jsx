import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { ProtectedRoute, PublicRoute } from "./AuthGuards";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDetail from "./components/AdminDetail";
import TenantDetail from "./components/TenantDetail";
import DomainDetail from "./components/DomainDetail";
import TenantCreate from "./components/TenantCreate";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        path="dashboard"
        element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="tenants" replace />} />
        <Route path="tenants" element={<TenantDetail />} />
        <Route path="admins" element={<AdminDetail />} />
        <Route path="domains" element={<DomainDetail />} />
        <Route path="tenants/new" element={<TenantCreate />} />
        <Route path="tenants/:id" element={<TenantCreate />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;
