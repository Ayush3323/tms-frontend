import React from 'react';
import { Truck, Package, Clock, CheckCircle2, MoreVertical, Bell } from 'lucide-react';

const StatCard = ({ title, value, subValue, icon, trend, trendValue, colorClass, borderColor }) => (
  <div className={`bg-[#F9FAFB]/50 p-8 group relative flex flex-col h-full hover:bg-white hover:shadow-lg hover:shadow-gray-200/40 transition-all cursor-default rounded-none ${borderColor} border-l-2`}>
    {/* 1. Header Row (Icon + Title) */}
    <div className="flex items-center gap-3 mb-6">
      <span className="text-black group-hover:text-gray-900 transition-colors">
        {React.cloneElement(icon, { size: 18, strokeWidth: 3 })}
      </span>
      <p className="text-[12px] font-black text-black uppercase tracking-widest leading-none">{title}</p>
    </div>

    {/* 2. Content Area (Dribbble 2x2 Grid) */}
    <div className="flex items-start justify-between mt-auto">
      {/* Left Column: Value & Subtext */}
      <div className="flex flex-col gap-3">
        <h3 className="text-4xl font-bold text-[#172B4D] tracking-tighter leading-none">{value}</h3>
        <p className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-none">{subValue}</p>
      </div>

      {/* Right Column: Trend & Timeframe */}
      <div className="flex flex-col items-end gap-3 pt-1">
        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[10px] font-black shadow-sm ${trend === 'up' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          {trend === 'up' ? '+' : '-'}{trendValue}
        </div>
        <p className="text-[10px] text-black/60 font-black uppercase tracking-widest whitespace-nowrap leading-none">vs yesterday</p>
      </div>
    </div>
  </div>
);

const OverviewCards = ({ onAlertClick }) => {
  const stats = [
    { title: "Total shipments today", value: "1,284", subValue: "From all shipments", icon: <Package />, trend: "up", trendValue: "12.5%", colorClass: "bg-[#10b981]" },
    { title: "Active trucks", value: "482", subValue: "Currently on route", icon: <Truck />, trend: "up", trendValue: "12.5%", colorClass: "bg-[#3b82f6]" },
    { title: "Avg. Delivery time", value: "4h 12m", subValue: "Faster than avg", icon: <Clock />, trend: "down", trendValue: "18m", colorClass: "bg-[#f59e0b]" },
    { title: "On-time delivery rate", value: "98.2%", subValue: "Target: 99.0%", icon: <CheckCircle2 />, trend: "down", trendValue: "0.4%", colorClass: "bg-[#ef4444]" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden flex flex-col">
      {/* Container Header (Seamless - No Border) */}
      <div className="px-8 py-2 flex items-center justify-between bg-[#FBFBFC]/30">
        <div className="flex items-center gap-4">
          <h2 className="text-[16px] font-black text-black uppercase tracking-widest">Operations overview</h2>
        </div>

        {/* Bell Icon (Larger & Bolder) */}
        <button
          onClick={onAlertClick}
          className="relative p-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition-all group scale-100"
        >
          <Bell size={24} strokeWidth={2.5} className="text-red-500 animate-bell-swing" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse-ring"></span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-8 pb-8 pt-0">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat}
            borderColor={
              idx === 0 ? 'border-l-[#10b981]' :
                idx === 1 ? 'border-l-[#3b82f6]' :
                  idx === 2 ? 'border-l-[#f59e0b]' : 'border-l-[#ef4444]'
            }
          />
        ))}
      </div>

      <style>{`
        @keyframes custom-swing {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(10deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(6deg); }
          40% { transform: rotate(-6deg); }
          50% { transform: rotate(3deg); }
          60% { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-bell-swing {
          display: inline-block;
          transform-origin: top center;
          animation: custom-swing 2.5s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default OverviewCards;
