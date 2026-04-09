import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, LogOut, LayoutGrid, Users, Globe, ChevronDown, Settings, Menu, X } from 'lucide-react';
import { useLogout } from '../queries/logoutQuery';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from '../queries/users/userActionQuery';
import SettingsModal from './Header/SettingsModal';

const Header = ({ toggleSidebar, isCollapsed }) => {
  const logoutMutation = useLogout();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLogoutDialogOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLogoutDialogOpen]);

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
    <header className={`h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 shadow-sm transition-all duration-300 ${isLogoutDialogOpen ? 'z-[9999]' : 'z-50'}`}>
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
          {/* User Profile Summary */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                isProfileOpen ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#4C9AFF] to-[#0052CC] rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm group-hover:scale-105 transition-transform">
                {currentUser?.first_name?.charAt(0)}{currentUser?.last_name?.charAt(0)}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-[#172B4D] leading-none">{currentUser?.first_name} {currentUser?.last_name}</p>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">{currentUser?.role}</p>
              </div>
            </div>

            {/* Profile Dropdown Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                {/* User Info Section in Dropdown */}
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-xs font-semibold text-[#172B4D] truncate">{currentUser?.first_name} {currentUser?.last_name}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{currentUser?.email}</p>
                </div>

                {/* Settings Option */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#172B4D] hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-[#0052CC] group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                    <Settings size={18} />
                  </div>
                  <span className="font-medium">Settings</span>
                </button>

                <div className="my-1 border-t border-gray-100"></div>

                {/* Logout Option */}
                <button
                  onClick={() => {
                    setIsLogoutDialogOpen(true);
                    setIsProfileOpen(false);
                  }}
                  disabled={logoutMutation.isPending}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group disabled:opacity-50"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 group-hover:bg-red-100 group-hover:scale-110 transition-all">
                    <LogOut size={18} />
                  </div>
                  <span className="font-medium">{logoutMutation.isPending ? 'Logging out...' : 'Log Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail={currentUser?.email}
      />

      {/* Logout Confirmation Dialog */}
      {isLogoutDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#091E42]/40 backdrop-blur-sm"
            onClick={() => setIsLogoutDialogOpen(false)}
          ></div>
          
          {/* Dialog Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <LogOut size={28} className="text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-[#172B4D] text-center mb-2">Confirm Logout</h3>
              <p className="text-gray-500 text-center mb-8">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsLogoutDialogOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsLogoutDialogOpen(false);
                  }}
                  disabled={logoutMutation.isPending}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 hover:shadow-red-300 transform active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {logoutMutation.isPending ? (
                    'Logging out...'
                  ) : (
                    <>
                      <LogOut size={16} />
                      Log Out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
