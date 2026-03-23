import React, { useState } from 'react';
import { 
  Globe, Plus, Search, Filter, Download, 
  MoreHorizontal, Eye, Edit2, Truck, CheckCircle2, 
  MapPin, Calendar, ChevronRight, ArrowRight,
  User, Hash, RefreshCcw, Clock, AlertTriangle
} from 'lucide-react';

// --- Configuration & Status Badges ---
const TRIP_STATUS_CONFIG = {
  CREATED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  STARTED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <RefreshCcw size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Truck size={14} /> },
  COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  DELAYED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertTriangle size={14} /> },
};

// --- Sub-components ---
const TripStatCard = ({ label, value, colorClass, icon: Icon }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-2xl font-black ${colorClass}`}>{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass.replace('text', 'bg')}/10`}>
      <Icon className={colorClass} size={20} />
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = TRIP_STATUS_CONFIG[status] || TRIP_STATUS_CONFIG.CREATED;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// --- Main Body Component ---
export default function TripsMainBody() {
  const [search, setSearch] = useState("");

  // Mock data based on your Trip Endpoints documentation
  const trips = [
    { 
      id: "uuid-1", 
      trip_number: "TRIP-2026-001", 
      lr_number: "LR-DEMO-0001", 
      trip_type: "FTL", 
      status: "CREATED", 
      primary_vehicle_id: "VH-9921", 
      primary_driver_id: "DR-552", 
      origin: "Mumbai Warehouse",
      destination: "Delhi DC",
      pickup: "2026-03-12"
    },
    { 
      id: "uuid-2", 
      trip_number: "TRIP-2026-002", 
      lr_number: "LR-DEMO-0002", 
      trip_type: "LTL", 
      status: "IN_TRANSIT", 
      primary_vehicle_id: "VH-8812", 
      primary_driver_id: "DR-102", 
      origin: "Pune Hub",
      destination: "Bangalore Warehouse",
      pickup: "2026-03-14"
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      <div className="p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Trip Management</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Track vehicle journeys, driver assignments, and trip status.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={16} /> Export
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0747A6] shadow-md shadow-blue-200 transition-all">
              <Plus size={18} /> Plan New Trip
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <TripStatCard label="Active Trips" value="24" colorClass="text-blue-600" icon={Globe} />
          <TripStatCard label="In Transit" value="18" colorClass="text-indigo-600" icon={Truck} />
          <TripStatCard label="Scheduled" value="42" colorClass="text-amber-600" icon={Calendar} />
          <TripStatCard label="Completed" value="156" colorClass="text-green-600" icon={CheckCircle2} />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search by Trip ID, LR No, Vehicle or Driver..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#0052CC] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
                <Filter size={16} /> Filters
              </button>
            </div>
          </div>

          {/* Trips Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip Details</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Route (Origin → Destination)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fleet Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                          <Hash size={14} className="text-gray-400" /> {trip.trip_number}
                        </span>
                        <span className="text-[11px] text-gray-500 font-semibold mt-1 bg-gray-100 px-1.5 py-0.5 rounded w-fit uppercase">
                          LR: {trip.lr_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col text-xs font-medium text-gray-700">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-500" /> {trip.origin}</span>
                          <div className="h-4 border-l-2 border-dashed border-gray-200 ml-1.5 my-1"></div>
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-red-500" /> {trip.destination}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                          <Truck size={14} className="text-gray-400" /> {trip.primary_vehicle_id}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                          <User size={14} className="text-gray-400" /> {trip.primary_driver_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={trip.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing {trips.length} active trips
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1 text-xs font-bold border border-gray-200 rounded text-gray-400 cursor-not-allowed">Previous</button>
              <button className="px-3 py-1 text-xs font-bold bg-[#0052CC] text-white rounded shadow-sm">1</button>
              <button className="px-3 py-1 text-xs font-bold border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}