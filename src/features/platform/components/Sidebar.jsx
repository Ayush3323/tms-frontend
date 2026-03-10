import React from 'react';
import { LayoutGrid, Users, Globe } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { name: 'Tenants', icon: <LayoutGrid size={18} />, path: '/admin/dashboard/tenants' },
    { name: 'Admins', icon: <Users size={18} />, path: '/admin/dashboard/admins' },
    { name: 'Domains', icon: <Globe size={18} />, path: '/admin/dashboard/domains' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#F8FAFC] border-r border-gray-200 flex flex-col justify-between p-4 sticky top-0 z-50">
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-[#0052CC] rounded-lg flex items-center justify-center">
            <LayoutGrid className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-[#172B4D] text-sm leading-tight">Platform Admin</h1>
            <p className="text-[10px] text-gray-500 font-medium">Management Console</p>
          </div>
        </div>

        {/* Navigation Labels */}
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Main</p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all border ${isActive
                    ? 'bg-[#EBF3FF] text-[#0052CC] border-[#D0E2FF]'
                    : 'text-gray-600 hover:bg-gray-100 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#0052CC]' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold">{item.name}</span>
                  </div>
                )}
              </NavLink>
            ))}
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
