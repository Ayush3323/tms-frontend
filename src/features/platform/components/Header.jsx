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
