import React, { useState } from 'react';
import OverviewCards from './OverviewCards';
import LiveTrackingMap from './LiveTrackingMap';
import { DeliveryProgressCircle, DeliveryTrendLine } from './AnalyticsCharts';
import ActivityTable from './ActivityTable';
import { Bell } from 'lucide-react';
import AlertsDrawer from './AlertsDrawer';

const DashboardOverview = () => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 bg-[#F4F5F7]">
      <AlertsDrawer isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
 
       {/* 2. Top Stats Cards Section */}
       <OverviewCards onAlertClick={() => setIsAlertsOpen(true)} />

      {/* 3. Middle Section: Trend & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[480px]">
        <div className="lg:col-span-1 h-full">
          <DeliveryTrendLine height={480} />
        </div>
        <div className="lg:col-span-2 h-full">
          <LiveTrackingMap height={480} />
        </div>
      </div>

      {/* 4. Bottom Section: Activity Table & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch h-[320px]">
        <div className="lg:col-span-2 h-full">
          <ActivityTable />
        </div>
        <div className="lg:col-span-1 h-full">
          <DeliveryProgressCircle />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
