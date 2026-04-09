import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, LogOut, LayoutGrid, Users, Globe, ChevronDown } from 'lucide-react';
import { useLogout } from '../queries/logoutQuery';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const logoutMutation = useLogout();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <header className={`h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 shadow-sm transition-all duration-300 ${isLogoutDialogOpen ? 'z-[9999]' : 'z-10'}`}>
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
          {/* User Profile Summary */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                isProfileOpen ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#4C9AFF] to-[#0052CC] rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm group-hover:scale-105 transition-transform">
                PA
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-[#172B4D] leading-none">Platform Admin</p>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-medium">Super Admin</p>
              </div>
            </div>

            {/* Profile Dropdown Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-xs font-semibold text-[#172B4D] truncate">Platform Admin</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">admin@tms.com</p>
                </div>

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

      {/* Logout Confirmation Dialog */}
      {isLogoutDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-[#091E42]/40 backdrop-blur-sm"
            onClick={() => setIsLogoutDialogOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <LogOut size={28} className="text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-[#172B4D] text-center mb-2">Confirm Logout</h3>
              <p className="text-gray-500 text-center mb-8">
                Are you sure you want to logout? You will need to sign in again to access the platform.
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
                  {logoutMutation.isPending ? 'Logging out...' : (
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
