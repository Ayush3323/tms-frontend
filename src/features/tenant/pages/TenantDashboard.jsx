import React, { useState } from 'react'

import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Outlet } from 'react-router-dom'

const TenantDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  }

  return (
    <div className="flex h-screen w-full bg-[#F4F5F7] overflow-hidden">
      {/* 1. Left Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* 2. Right Side Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <Header toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 bg-[#F4F5F7] flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard
