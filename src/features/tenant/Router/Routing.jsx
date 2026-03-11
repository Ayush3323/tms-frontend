import React from 'react'
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import TenantDashboard from "../pages/TenantDashboard";
import { ProtectedRoute, PublicRoute } from "../Router/AuthGuards";

const Routing = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tenant/login" />} />
        <Route path="/tenant/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route
          path="/tenant/dashboard"
          element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>}
        >
          {/* Default child route */}
          {/* <Route index element={<Navigate to="tenants" replace />} />
          <Route path="tenants" element={<TenantDetail />} /> 
          <Route path="admins" element={<AdminDetail />} />     
          <Route path="domains" element={<DomainDetail />} /> 
          <Route path="tenants/new" element={<TenantCreate />}  />
          <Route path="tenants/:id" element={<TenantCreate />} />       */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Routing