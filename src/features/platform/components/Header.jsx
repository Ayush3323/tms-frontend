import React from 'react';
import { ChevronRight, LogOut, ExternalLink } from 'lucide-react';
import { useLogout } from '../queries/logoutQuery';

const Header = () => {
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Breadcrumbs Left */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">Platform</span>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="font-bold text-[#172B4D]">Tenants</span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Sample Data Button */}
        <button className="flex items-center gap-2 px-3 py-1.5 border border-[#FFAB00] text-[#FFAB00] rounded text-xs font-bold hover:bg-orange-50 transition-colors">
          <span className="text-[10px]">📄</span> Sample Data
        </button>

        {/* Localhost Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F5F7] rounded text-[#42526E] text-xs font-medium border border-gray-200">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          localhost:8000
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
};

export default Header;
