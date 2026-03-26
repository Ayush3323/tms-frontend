import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { ChevronDown } from 'lucide-react';

const dataPie = [
  { name: 'Success', value: 642, color: '#10b981' },
  { name: 'Process', value: 257, color: '#3b82f6' },
  { name: 'Delayed', value: 103, color: '#f59e0b' },
  { name: 'Return', value: 282, color: '#ef4444' },
];

const dataTrend = [
  { day: '08:00', delivered: 100, delayed: 30 },
  { day: '09:00', delivered: 180, delayed: 40 },
  { day: '10:00', delivered: 220, delayed: 35 },
  { day: '11:00', delivered: 300, delayed: 45 },
  { day: '12:00', delivered: 400, delayed: 60 },
  { day: '13:00', delivered: 550, delayed: 55 },
  { day: '14:00', delivered: 500, delayed: 70 },
];

export const DeliveryProgressCircle = () => {
  const [hoveredData, setHoveredData] = useState(null);
  const totalValue = dataPie.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full transition-all hover:shadow-md">
      <h3 className="text-[11px] font-black text-black uppercase tracking-widest mb-2">Delivery Percentage</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[170px] -mt-2">
        <div className="w-full h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPie}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setHoveredData(dataPie[index])}
                onMouseLeave={() => setHoveredData(null)}
              >
                {dataPie.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{ outline: 'none', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-center pointer-events-none">
            <p className="text-3xl font-black text-[#172B4D] tracking-tighter">
                {hoveredData 
                    ? `${Math.round((hoveredData.value / totalValue) * 100)}%` 
                    : '77%'
                }
            </p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                {hoveredData ? hoveredData.name : 'Success'}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2 pt-4 border-t border-gray-50">
        {dataPie.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{item.name}</span>
            <span className="text-[10px] font-black text-[#172B4D] ml-auto">{hoveredData?.name === item.name ? item.value : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 flex flex-col gap-2 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-1">Today • {label} PM</p>
        <div className="space-y-2">
            {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-[10px] font-bold text-gray-600 capitalize">{entry.name}</span>
                </div>
                <span className="text-[11px] font-black text-[#172B4D]">{entry.value}</span>
            </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};


export const DeliveryTrendLine = ({ height = 320 }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full transition-all hover:shadow-md font-inter overflow-hidden relative">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
            <h3 className="text-[15px] font-black text-black uppercase tracking-widest leading-none mb-1">Delivery performance</h3>
            <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivered</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delayed</span>
                </div>
            </div>
        </div>
        <div className="flex bg-gray-50/50 p-1 rounded-xl border border-gray-100">
            <button className="px-3 py-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-[9px] font-black text-[#172B4D] uppercase tracking-wider flex items-center gap-2">
                Weekly <ChevronDown size={12} className="text-gray-400" />
            </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataTrend} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
            <CartesianGrid vertical={true} stroke="rgba(0,0,0,0.08)" strokeDasharray="0" />
            <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 800, fill: 'rgba(0,0,0,0.4)' }} 
                dy={15} 
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 800, fill: 'rgba(0,0,0,0.4)' }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
            
            {/* Baseline above X-axis labels */}
            <ReferenceLine y={0} stroke="#f1f5f9" strokeWidth={2} />

            <Line 
              type="monotone" 
              name="Delivered"
              dataKey="delivered" 
              stroke="#059669" 
              strokeWidth={4} 
              dot={{ fill: '#059669', strokeWidth: 2, r: 2.5 }} 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
            />
            <Line 
              type="monotone" 
              name="Delayed"
              dataKey="delayed" 
              stroke="#dc2626" 
              strokeWidth={3} 
              strokeDasharray="6 6"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: '#dc2626' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const AnalyticsCharts = () => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <DeliveryProgressCircle />
            <DeliveryTrendLine />
        </div>
    );
};

export default AnalyticsCharts;
