import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';

const activities = [
  { id: 1, tripNo: 'TRP-2041', dateTime: 'Mar 28, 10:15 AM', activity: 'New order placed', details: 'Order #98765 confirmed for shipping', vehicle: 'DL-01-AB-1234', status: 'In transit' },
  { id: 2, tripNo: 'TRP-2038', dateTime: 'Mar 28, 08:45 AM', activity: 'Shipment dispatched', details: 'Order #56789 left Warehouse #3', vehicle: 'HR-26-CD-5678', status: 'In transit' },
  { id: 3, tripNo: 'TRP-2037', dateTime: 'Mar 28, 08:30 AM', activity: 'Delivery confirmed', details: 'Order #45612 delivered - Chandigarh', vehicle: 'UP-16-FF-9012', status: 'Delivered' },
  { id: 4, tripNo: 'TRP-2042', dateTime: 'Mar 26, 11:00 AM', activity: 'Loading started', details: 'Vehicle at Noida warehouse bay 4', vehicle: 'DL-03-GH-3456', status: 'Loading' },
  { id: 5, tripNo: 'TRP-2039', dateTime: 'Mar 26, 09:10 AM', activity: 'Delay reported', details: 'Traffic on NH-24 - 45 min delay', vehicle: 'MH-12-CD-3344', status: 'Delayed' },
  { id: 6, tripNo: 'TRP-2043', dateTime: 'Mar 26, 07:50 AM', activity: 'Pickup scheduled', details: 'Driver en route to Jaipur origin', vehicle: 'RJ-14-IJ-7890', status: 'Pick-up' },
  { id: 7, tripNo: 'TRP-2045', dateTime: 'Mar 29, 09:00 AM', activity: 'Approval Pending', details: 'Awaiting manager sign-off for route', vehicle: 'DL-01-XX-9999', status: 'Scheduled' },
  { id: 8, tripNo: 'TRP-2046', dateTime: 'Mar 29, 10:30 AM', activity: 'Planned Trip', details: 'Scheduled for tomorrow morning', vehicle: 'HR-26-YY-8888', status: 'Scheduled' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    'In transit': 'bg-blue-50 text-blue-600 border-blue-100',
    'Delivered': 'bg-green-50 text-green-600 border-green-100',
    'Loading': 'bg-orange-50 text-orange-600 border-orange-100',
    'Delayed': 'bg-red-50 text-red-600 border-red-100',
    'Pick-up': 'bg-purple-50 text-purple-600 border-purple-100',
    'Scheduled': 'bg-gray-50 text-gray-600 border-gray-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${styles[status] || styles['Scheduled']}`}>
      {status}
    </span>
  );
};

const ActivityTable = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [showSeeAllDropdown, setShowSeeAllDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSeeAllDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'Active') return activity.status !== 'Delivered' && activity.status !== 'Scheduled';
    if (activeTab === 'Completed') return activity.status === 'Delivered';
    if (activeTab === 'Scheduled') return activity.status === 'Scheduled';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
      <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
        <h3 className="text-[16px] font-black text-black uppercase tracking-widest">Recent activities</h3>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {['Active', 'Completed', 'Scheduled'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-white text-[#172B4D] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSeeAllDropdown(!showSeeAllDropdown)}
              className="px-3 py-2 text-[10px] font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-all uppercase tracking-widest flex items-center gap-1.5"
            >
              See all <ChevronDown size={14} className={`transition-transform duration-300 ${showSeeAllDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSeeAllDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  {['Active', 'Completed', 'Scheduled'].map(option => (
                    <button
                      key={option}
                      className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-all"
                      onClick={() => setShowSeeAllDropdown(false)}
                    >
                      <span className="uppercase tracking-widest">{option} Trips</span>
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 no-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="px-4 py-3 text-[11px] font-black text-black uppercase tracking-widest whitespace-nowrap">Trip No.</th>
              <th className="px-4 py-3 text-[11px] font-black text-black uppercase tracking-widest whitespace-nowrap">Date & Time</th>
              <th className="px-4 py-3 text-[11px] font-black text-black uppercase tracking-widest whitespace-nowrap">Activity</th>
              <th className="px-4 py-3 text-[11px] font-black text-black uppercase tracking-widest whitespace-nowrap">Details</th>
              <th className="px-4 py-3 text-[11px] font-black text-black uppercase tracking-widest whitespace-nowrap">Vehicle</th>
              <th className="px-4 py-3 text-[11px] font-black text-black uppercase tracking-widest text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-4 py-3 text-[13.5px] font-black text-[#172B4D]">{activity.tripNo}</td>
                <td className="px-4 py-3 text-[12px] font-bold text-gray-500 whitespace-nowrap">{activity.dateTime}</td>
                <td className="px-4 py-3 text-[13px] font-bold text-[#172B4D] whitespace-nowrap">{activity.activity}</td>
                <td
                  className="px-4 py-3 text-[12.5px] text-gray-400 font-medium max-w-[200px] truncate cursor-help"
                  title={activity.details}
                >
                  {activity.details}
                </td>
                <td className="px-4 py-3 text-[12.5px] font-black text-gray-500 uppercase whitespace-nowrap">{activity.vehicle}</td>
                <td className="px-4 py-3 text-right"><StatusBadge status={activity.status} /></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest">No activities found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityTable;
