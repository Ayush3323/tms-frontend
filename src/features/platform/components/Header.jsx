import React from 'react';
import { ChevronRight, LogOut, LayoutGrid, Users, Globe, ChevronDown } from 'lucide-react';
import { useLogout } from '../queries/logoutQuery';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const logoutMutation = useLogout();
  const location = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getBreadcrumbName = () => {
    const path = location.pathname;

    if (path.includes('/admins')) return 'Admins';
    if (path.includes('/domains')) return 'Domains';
    if (path.includes('/tenants')) {
      if (path.includes('/new')) return 'Create Tenant';
      if (path.match(/\/tenants\/[^/]+$/)) return 'Edit Tenant';
      return 'Tenants';
    }

    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      {/* Breadcrumbs Left */}
      <div className="flex items-center gap-2 text-sm">
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
          {/* Vertical Divider */}
          <div className="w-px h-6 bg-gray-200"></div>

          {/* User Profile Summary (Optional, but adds premium feel) */}
          <div className="flex items-center gap-3 px-2 py-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
            <div className="w-8 h-8 bg-[#4C9AFF] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              PA
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-[#172B4D] leading-none">Platform Admin</p>
              <p className="text-[10px] text-gray-500 mt-1">Super Admin</p>
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
    </header>
  );
};

export default Header;
