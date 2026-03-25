import React from 'react'

import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'

const TenantDashboard = () => {
  return (
    <div className="flex h-screen w-full bg-[#F4F5F7] overflow-hidden">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Right Side Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 bg-[#F4F5F7] flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard
