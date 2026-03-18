import React from 'react'
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import TenantDashboard from "../pages/TenantDashboard";
import { ProtectedRoute, PublicRoute } from "../Router/AuthGuards";
import Userdetail from '../components/user/Userdetail'
import UserProfile from '../components/user/UserProfile'
import Vehicles from '../components/Vehicles/List/VehiclesList'
import VehicleDetail from '../components/Vehicles/Details/VehicleDetail';
import VehicleTypes from '../components/Vehicles/Features/VehicleTypes';
import VehiclesDocument from '../components/Vehicles/Features/Documents';
import VehicleInsurance from '../components/Vehicles/Features/Insurance';
import MaintenanceSchedules from '../components/Vehicles/Features/Maintenance'
import VehicleInspections from '../components/Vehicles/Features/Inspections';
import TiresDashboard from '../components/Vehicles/Features/Tires';
import DriversList from '../components/Drivers/DriversList'
import DriverDetail from '../components/Drivers/detail/DriverDetail'
import Roles from '../components/user/Roles'
import Permission from '../components/user/Permission'
import Activities from '../components/user/Activities'
import Session from '../components/user/Session'
import AccessoriesDashboard from '../components/Vehicles/Features/Accessories';
import VehicleTollTagsDashboard from '../components/Vehicles/Features/TollTags';
import VehicleOwnershipDashboard from '../components/Vehicles/Features/Ownership';

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
          <Route path="users/activities" element={<Activities />} />
          <Route path="users/session" element={<Session />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<DriversList />} />
          <Route path="drivers/:id" element={<DriverDetail />} />
          <Route path="vehicles/types" element={<VehicleTypes />} />
          <Route path="vehicles/documents" element={<VehiclesDocument />} />
          <Route path="vehicles/insurance" element={<VehicleInsurance />} />
          <Route path="vehicles/maintenance" element={<MaintenanceSchedules />} />
          <Route path="vehicles/inspections" element={<VehicleInspections />} />
          <Route path="vehicles/tires" element={<TiresDashboard />} />
          <Route path="vehicles/accessories" element={<AccessoriesDashboard />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="vehicles/:id/edit" element={<VehicleDetail />} />
          <Route path="vehicles/toll-tags" element={<VehicleTollTagsDashboard />} />
          <Route path="vehicles/toll-tags/:id" element={<VehicleTollTagsDashboard />} />
          <Route path="vehicles/ownership" element={<VehicleOwnershipDashboard />} />
          <Route path="vehicles/ownership/:id" element={<VehicleOwnershipDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Routing