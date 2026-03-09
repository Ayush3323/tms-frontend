import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../../features/platform/pages/Login";
import { ProtectedRoute, PublicRoute } from "./AuthGuards";
import AdminDashboard from "../../features/platform/pages/AdminDashboard";
import AdminDetail from "../../features/platform/components/AdminDetail";
import TenantDetail  from "../../features/platform/components/TenantDetail";
import DomainDetail from "../../features/platform/components/DomainDetail";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect to login */}
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<PublicRoute>{<Login />}</PublicRoute>} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* Default child route */}
          <Route index element={<Navigate to="tenants" replace />} />
          <Route path="tenants" element={<TenantDetail />} />
          <Route path="admins" element={<AdminDetail />} />     
          <Route path="domains" element={<DomainDetail />} />         
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
