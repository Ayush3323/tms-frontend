import React from 'react';
import { X, AlertCircle, Bell, Clock, Package, Truck, Info, AlertTriangle } from 'lucide-react';

const alertData = [
  { id: 1, type: 'critical', title: 'Route Deviation', desc: 'Vehicle DL-01-AB-1234 deviated from planned route in Gurgaon.', time: '2 mins ago', icon: <Truck className="text-red-600" /> },
  { id: 2, type: 'warning', title: 'Delayed Shipment', desc: 'Order #56789 is running 45 mins behind schedule.', time: '15 mins ago', icon: <Clock className="text-orange-600" /> },
  { id: 3, type: 'info', title: 'New Order', desc: 'New high-priority pickup scheduled for Mumbai warehouse.', time: '1 hour ago', icon: <Package className="text-blue-600" /> },
  { id: 4, type: 'critical', title: 'Temperature Alert', desc: 'Cold storage unit DL-345 sensor reporting 8°C (Limit 5°C).', time: '2 hours ago', icon: <AlertTriangle className="text-red-600" /> },
];

const AlertsDrawer = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[350px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.1)] z-[201] transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header - Red Theme */}
          <div className="p-6 bg-red-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bell size={22} className="animate-swing text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">System Alerts</h2>
                <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest">Live Monitoring</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2 sticky top-0 bg-transparent py-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">4 New Events</span>
              <button className="text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider">Clear All</button>
            </div>
            
            {alertData.map((alert) => (
              <div key={alert.id} className={`group relative p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${alert.type === 'critical' ? 'bg-white border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.1)]' : 'bg-white border-gray-100'}`}>
                {alert.type === 'critical' && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 rounded-l-2xl"></div>
                )}
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl h-fit shadow-sm ${alert.type === 'critical' ? 'bg-red-50' : 'bg-gray-50'}`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-[13px] font-bold ${alert.type === 'critical' ? 'text-red-700' : 'text-[#172B4D]'}`}>{alert.title}</h4>
                      <div className="flex items-center gap-1 text-gray-400">
                         <Clock size={10} />
                         <span className="text-[10px] font-bold">{alert.time}</span>
                      </div>
                    </div>
                    <p className={`text-[11px] leading-relaxed font-semibold ${alert.type === 'critical' ? 'text-red-600/80' : 'text-gray-500'}`}>
                      {alert.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default AlertsDrawer;
