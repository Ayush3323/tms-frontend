import React from 'react'
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import TenantDashboard from "../pages/TenantDashboard";
import { ProtectedRoute, PublicRoute } from "../Router/AuthGuards";
import Userdetail from '../components/user/Userdetail'
import UserProfile from '../components/user/UserProfile'
import Vehicles from '../components/Vehicles/Vehicles'
import VehicleDetail from '../components/Vehicles/VehicleDetail';
import VehicleTypes from '../components/Vehicles/VehiclesType';
import VehiclesDocument from '../components/Vehicles/VehiclesDocument';
import VehicleInsurance from '../components/Vehicles/vehiclesInsurance';
import MaintenanceSchedules from '../components/Vehicles/VehiclesMaintenanceSchedules'
import DriversList from '../components/Drivers/DriversList'
import DriverDetail from '../components/Drivers/DriverDetail'
import Roles from '../components/user/Roles'
import Permission from '../components/user/Permission'



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
          <Route path="users/roles" element={<Roles />} />
          <Route path="users/permission" element={<Permission />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<DriversList />} />
          <Route path="drivers/:id" element={<DriverDetail />} /> 
          <Route path="vehicles/types" element={<VehicleTypes />} />
          <Route path="vehicles/documents" element={<VehiclesDocument />} />
          <Route path="vehicles/:id" element={<VehicleDetail/>}/>
          <Route path= "vehicles/insurance" element={<VehicleInsurance />} />
          <Route path="vehicles/:id/edit" element={<VehicleDetail/>}/>
          <Route path="vehicles/maintenance" element={<MaintenanceSchedules />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Routing