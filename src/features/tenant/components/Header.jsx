import React from 'react';
import { ChevronRight, LogOut, LayoutGrid, Users, Globe, ChevronDown, Settings, Menu, X } from 'lucide-react';
import { useLogout } from '../queries/logoutQuery';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from '../queries/users/userActionQuery';
import SettingsModal from './Header/SettingsModal';
import { useState } from 'react';

const Header = ({ toggleSidebar, isCollapsed }) => {
  const logoutMutation = useLogout();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getBreadcrumbName = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    // Path structure: /tenant/dashboard/feature/subfeature
    // parts[0] = 'tenant', parts[1] = 'dashboard', parts[2] = 'feature'
    
    if (parts.length >= 3) {
      const feature = parts[2];
      if (feature === 'overview') return 'Dashboard';
      if (feature === 'users') return 'Users';
      if (feature === 'vehicles') return 'Vehicles';
      if (feature === 'drivers') return 'Drivers';
      if (feature === 'customers') return 'Customers';
      if (feature === 'orders') return 'Orders';
      
      return feature.charAt(0).toUpperCase() + feature.slice(1);
    }

    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      {/* Breadcrumbs Left */}
      <div className="flex items-center gap-4 text-sm">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>

        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-gray-400 font-medium group-hover:text-gray-600 transition-colors">Platform</span>
        </div>

        <ChevronRight size={14} className="text-gray-300 mx-1" />

        <div className="flex items-center px-1 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="font-bold text-[#172B4D] tracking-tight text-sm">{getBreadcrumbName()}</span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        {/* Search or other actions could go here */}

        <div className="flex items-center gap-4">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 transition-all duration-300 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#0052CC] hover:rotate-45"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-gray-200"></div>

          {/* User Profile Summary (Optional, but adds premium feel) */}
          <div className="flex items-center gap-3 px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
            <div className="w-8 h-8 bg-[#4C9AFF] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {currentUser?.first_name?.charAt(0)}{currentUser?.last_name?.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-[#172B4D] leading-none">{currentUser?.first_name} {currentUser?.last_name}</p>
              <p className="text-[10px] text-gray-500 mt-1">{currentUser?.role}</p>
            </div>
         </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userEmail={currentUser?.email}
      />
    </header>
  );
};

export default Header;
