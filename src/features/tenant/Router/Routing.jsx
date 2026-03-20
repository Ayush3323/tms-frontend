import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
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
import DriverDetail from '../components/Drivers/DriverDetail'
import CustomersDashboard from '../components/customers/customers'
import Consigners from '../components/customers/consigners'
import Consignees from '../components/customers/consignees'
import Brokers from '../components/customers/brokers';



// Global Driver Views
import AllDocuments from '../components/Drivers/all/AllDocuments';
import AllContacts from '../components/Drivers/all/AllContacts';
import AllTraining from '../components/Drivers/all/AllTraining';
import AllMedical from '../components/Drivers/all/AllMedical';
import AllPerformance from '../components/Drivers/all/AllPerformance';
import AllIncidents from '../components/Drivers/all/AllIncidents';
import AllAttendance from '../components/Drivers/all/AllAttendance';
import AllAssignments from '../components/Drivers/all/AllAssignments';
import AllSalaryStructures from '../components/Drivers/all/AllSalaryStructures';

import Roles from '../components/user/Roles'
import Permission from '../components/user/Permission'
import Activities from '../components/user/Activities'
import Session from '../components/user/Session'
import AccessoriesDashboard from '../components/Vehicles/Features/Accessories';
import VehicleTollTagsDashboard from '../components/Vehicles/Features/TollTags';
import VehicleOwnershipDashboard from '../components/Vehicles/Features/Ownership';

const Routing = () => {
  return (
    <Routes>
      <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        path="dashboard"
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

        {/* Global Driver Routes */}
        <Route path="drivers/documents" element={<AllDocuments />} />
        <Route path="drivers/emergency-contacts" element={<AllContacts />} />
        <Route path="drivers/training" element={<AllTraining />} />
        <Route path="drivers/medical" element={<AllMedical />} />
        <Route path="drivers/performance" element={<AllPerformance />} />
        <Route path="drivers/incidents" element={<AllIncidents />} />
        <Route path="drivers/attendance" element={<AllAttendance />} />
        <Route path="drivers/vehicle-assignments" element={<AllAssignments />} />
        <Route path="drivers/salary" element={<AllSalaryStructures />} />

        {/* Specific Driver Detail Route (Must be last to avoid catching sub-paths as IDs) */}
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

        {/* Specific Customer Detail Route (Must be last to avoid catching sub-paths as IDs) */}

        <Route path="customers" element={<CustomersDashboard />} />
        <Route path="customers/consigners" element={<Consigners />} />
        <Route path="customers/consignees" element={<Consignees />} />
        <Route path="customers/brokers" element={<Brokers />} />



      </Route>
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  )
}

export default Routing