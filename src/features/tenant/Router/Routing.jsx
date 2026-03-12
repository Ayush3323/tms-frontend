import React from 'react'
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import TenantDashboard from "../pages/TenantDashboard";
import { ProtectedRoute, PublicRoute } from "../Router/AuthGuards";
import Userdetail from '../components/Userdetail'
import Vehicles from '../components/Vehicles'
import Drivers from '../components/Drivers'


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
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<Userdetail />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<Drivers />} />  
          
          
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Routing