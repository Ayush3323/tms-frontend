import React from 'react';
// Importing from src/features/platform/components/
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Body from '../components/Body';

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen w-full bg-[#F4F5F7]">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Right Side Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <Header />
        
        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto">
          <Body />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;