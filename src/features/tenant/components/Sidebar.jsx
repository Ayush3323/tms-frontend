import React, { useState } from 'react';
import {
  LayoutGrid, Users, Globe, Truck, FileText, Shield,
  Wrench, Search, Fuel, Settings, Plug, Tag, ScrollText,
  ChevronDown, UserCheck, Phone, GraduationCap,
  HeartPulse, BarChart2, AlertTriangle, CalendarClock, Car, Banknote
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const vehicleSubItems = [
  { name: 'All Vehicles', icon: <Truck size={13} />, path: '/tenant/dashboard/vehicles', badge: null },
  { name: 'Vehicle Types', icon: <LayoutGrid size={13} />, path: '/tenant/dashboard/vehicles/types', badge: null },
  { name: 'Documents', icon: <FileText size={13} />, path: '/tenant/dashboard/vehicles/documents', badge: 2, badgeVariant: 'danger' },
  { name: 'Insurance', icon: <Shield size={13} />, path: '/tenant/dashboard/vehicles/insurance', badge: null },
  { name: 'Maintenance', icon: <Wrench size={13} />, path: '/tenant/dashboard/vehicles/maintenance', badge: 3, badgeVariant: 'warn' },
  { name: 'Inspections', icon: <Search size={13} />, path: '/tenant/dashboard/vehicles/inspections', badge: null },
  { name: 'Fuel Logs', icon: <Fuel size={13} />, path: '/tenant/dashboard/vehicles/fuel', badge: null },
  { name: 'Tires', icon: <Settings size={13} />, path: '/tenant/dashboard/vehicles/tires', badge: null },
  { name: 'Accessories', icon: <Plug size={13} />, path: '/tenant/dashboard/vehicles/accessories', badge: null },
  { name: 'Toll Tags', icon: <Tag size={13} />, path: '/tenant/dashboard/vehicles/toll-tags', badge: null },
  { name: 'Ownership', icon: <ScrollText size={13} />, path: '/tenant/dashboard/vehicles/ownership', badge: null },
];

const driverSubItems = [
  { name: 'All Drivers', icon: <UserCheck size={13} />, path: '/tenant/dashboard/drivers', badge: null },
  { name: 'Documents', icon: <FileText size={13} />, path: '/tenant/dashboard/drivers/documents', badge: null },
  { name: 'Emergency Contacts', icon: <Phone size={13} />, path: '/tenant/dashboard/drivers/emergency-contacts', badge: null },
  { name: 'Training Records', icon: <GraduationCap size={13} />, path: '/tenant/dashboard/drivers/training', badge: null },
  { name: 'Medical Records', icon: <HeartPulse size={13} />, path: '/tenant/dashboard/drivers/medical', badge: null },
  { name: 'Performance', icon: <BarChart2 size={13} />, path: '/tenant/dashboard/drivers/performance', badge: null },
  { name: 'Incidents', icon: <AlertTriangle size={13} />, path: '/tenant/dashboard/drivers/incidents', badge: 1, badgeVariant: 'danger' },
  { name: 'Attendance', icon: <CalendarClock size={13} />, path: '/tenant/dashboard/drivers/attendance', badge: null },
  { name: 'Vehicle Assignments', icon: <Car size={13} />, path: '/tenant/dashboard/drivers/vehicle-assignments', badge: null },
  { name: 'Salary Structures', icon: <Banknote size={13} />, path: '/tenant/dashboard/drivers/salary', badge: null },
];

const userSubItems = [
  { name: 'All Users', icon: <Users size={13} />, path: '/tenant/dashboard/users', badge: null },
  { name: 'Roles', icon: <Shield size={13} />, path: '/tenant/dashboard/users/roles', badge: null },
  { name: 'Permissions', icon: <Shield size={13} />, path: '/tenant/dashboard/users/permission', badge: null },
  { name: 'Activities', icon: <Shield size={13} />, path: '/tenant/dashboard/users/activities', badge: null },
];

const SubMenu = ({ items }) => (
  <div className="ml-5 pl-3 border-l-2 border-gray-200 mt-1 mb-1 space-y-0.5">
    {items.map((item) => (
      <NavLink
        key={item.name}
        to={item.path}
        end={item.path === '/tenant/dashboard/vehicles' || item.path === '/tenant/dashboard/drivers' || item.path === '/tenant/dashboard/users'}
        className={({ isActive }) =>
          `flex items-center gap-2 px-2.5 py-[6px] rounded-md text-[12.5px] transition-all border ${isActive
            ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF] font-semibold'
            : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700 font-normal'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#0052CC]' : 'bg-gray-300'}`} />
            <span className={isActive ? 'text-[#0052CC]' : 'text-gray-400'}>{item.icon}</span>
            <span className="flex-1">{item.name}</span>


          </>
        )}
      </NavLink>
    ))}
  </div>
);

const Sidebar = () => {
  const location = useLocation();

  const isVehiclePath = location.pathname.startsWith('/tenant/dashboard/vehicles');
  const isDriverPath = location.pathname.startsWith('/tenant/dashboard/drivers');
  const isUserPath = location.pathname.startsWith('/tenant/dashboard/users');

  const [vehiclesOpen, setVehiclesOpen] = useState(isVehiclePath);
  const [driversOpen, setDriversOpen] = useState(isDriverPath);
  const [usersOpen, setUsersOpen] = useState(isUserPath);

  return (
    <aside className="w-64 h-screen bg-[#F8FAFC] border-r border-gray-200 flex flex-col justify-between p-4 sticky top-0 z-50 overflow-y-auto">
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-[#0052CC] rounded-lg flex items-center justify-center">
            <LayoutGrid className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-[#172B4D] text-sm leading-tight">Tenant Admin</h1>
            <p className="text-[10px] text-gray-500 font-medium">Management Console</p>
          </div>
        </div>

        {/* Navigation Labels */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Main</p>
          <nav className="space-y-1">

            {/* Users Dropdown */}
            <div>
              <button
                onClick={() => setUsersOpen((o) => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border ${isUserPath
                    ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF]'
                    : 'text-gray-600 hover:bg-gray-100 border-transparent'
                  }`}
              >
                <span className={isUserPath ? 'text-[#0052CC]' : 'text-gray-400'}>
                  <Users size={18} />
                </span>
                <span className="text-sm font-semibold flex-1 text-left">Users</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${usersOpen ? 'rotate-180' : 'rotate-0'} ${isUserPath ? 'text-[#0052CC]' : 'text-gray-400'}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${usersOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <SubMenu items={userSubItems} />
              </div>
            </div>

            {/* Vehicles Dropdown */}
            <div>
              <button
                onClick={() => setVehiclesOpen((o) => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border ${isVehiclePath
                    ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF]'
                    : 'text-gray-600 hover:bg-gray-100 border-transparent'
                  }`}
              >
                <span className={isVehiclePath ? 'text-[#0052CC]' : 'text-gray-400'}>
                  <Truck size={18} />
                </span>
                <span className="text-sm font-semibold flex-1 text-left">Vehicles</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${vehiclesOpen ? 'rotate-180' : 'rotate-0'} ${isVehiclePath ? 'text-[#0052CC]' : 'text-gray-400'}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${vehiclesOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <SubMenu items={vehicleSubItems} />
              </div>
            </div>

            {/* Drivers Dropdown */}
            <div>
              <button
                onClick={() => setDriversOpen((o) => !o)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border ${isDriverPath
                    ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF]'
                    : 'text-gray-600 hover:bg-gray-100 border-transparent'
                  }`}
              >
                <span className={isDriverPath ? 'text-[#0052CC]' : 'text-gray-400'}>
                  <Users size={18} />
                </span>
                <span className="text-sm font-semibold flex-1 text-left">Drivers</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${driversOpen ? 'rotate-180' : 'rotate-0'} ${isDriverPath ? 'text-[#0052CC]' : 'text-gray-400'}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${driversOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <SubMenu items={driverSubItems} />
              </div>
            </div>

          </nav>
        </div>
      </div>

      {/* Footer Profile Section */}
      {/* <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4C9AFF] rounded flex items-center justify-center text-white font-bold text-xs uppercase">
          PA
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-bold text-[#172B4D] truncate">Platform Admin</p>
          <p className="text-[10px] text-gray-400 truncate">Super Admin</p>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;
