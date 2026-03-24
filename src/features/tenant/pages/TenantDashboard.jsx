import React from 'react'

import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'

const TenantDashboard = () => {
  return (
    <div className="flex max-h-screen  w-full bg-[#F4F5F7]">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Right Side Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header />

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-scroll scrollbar-hide h-[100vh]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard
