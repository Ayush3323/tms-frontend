import React from 'react'
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import TenantDashboard from "../pages/TenantDashboard";
import { ProtectedRoute, PublicRoute } from "../Router/AuthGuards";
import Userdetail from '../components/Userdetail'
import UserProfile from '../components/UserProfile'
import Vehicles from '../components/Vehicles/Vehicles'
import VehicleDetail from '../components/Vehicles/VehicleDetail';
import VehicleTypes from '../components/Vehicles/VehiclesType';
import VehiclesDocument from '../components/Vehicles/VehiclesDocument';
import VehicleInsurance from '../components/Vehicles/vehiclesInsurance';
import DriversList from '../components/Drivers/DriversList'
import DriverDetail from '../components/Drivers/DriverDetail'



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
          <Route path="users/:userid" element={<UserProfile />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<DriversList />} />
          <Route path="drivers/:id" element={<DriverDetail />} /> 
          <Route path="vehicles/types" element={<VehicleTypes />} />
          <Route path="vehicles/documents" element={<VehiclesDocument />} />le
          <Route path="vehicles/:id" element={<VehicleDetail/>}/>
          <Route path= "vehicles/insurance" element={<VehicleInsurance />} />
          <Route path="vehicles/:id/edit" element={<VehicleDetail/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Routing