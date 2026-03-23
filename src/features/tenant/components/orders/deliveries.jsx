import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, Download, Plus, 
  MapPin, User, FileCheck, Image as ImageIcon,
  MoreHorizontal, Eye, Edit2, Trash2, 
  ExternalLink, Calendar, Hash
} from 'lucide-react';

// --- Configuration & Status Badges ---
const POD_STATUS_CONFIG = {
  PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
  SUBMITTED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <FileCheck size={14} /> },
  VERIFIED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  REJECTED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertCircle size={14} /> },
};

// --- Sub-components ---
const DeliveryStatCard = ({ label, value, colorClass, icon: Icon }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
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
  const config = POD_STATUS_CONFIG[status] || POD_STATUS_CONFIG.PENDING;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// --- Main Body Component ---
export default function DeliveryMainBody() {
  const [search, setSearch] = useState("");

  // Mock data based on your DeliveryDashboard.jsx
  const deliveries = [
    { 
      id: "pod-001", 
      pod_number: "POD-2026-001", 
      trip_stop: "STP-882", 
      received_by: "Rahul Sharma", 
      status: "VERIFIED", 
      delivery_date: "2026-03-22",
      has_images: true,
      location: "New Delhi Warehouse"
    },
    { 
      id: "pod-002", 
      pod_number: "POD-2026-002", 
      trip_stop: "STP-991", 
      received_by: "Amit Verma", 
      status: "PENDING", 
      delivery_date: "2026-03-23",
      has_images: false,
      location: "Mumbai Port Term-1"
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      <div className="p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Deliveries & POD</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Verify Proof of Delivery (POD), track recipient signatures, and delivery timing.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
              <Download size={16} /> Bulk Export
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0747A6] shadow-md shadow-blue-200 transition-all">
              <Plus size={18} /> New POD Record
            </button>
          </div>
        </div>

        {/* POD Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DeliveryStatCard label="Total Deliveries" value="1,420" colorClass="text-blue-600" icon={Shield} />
          <DeliveryStatCard label="Verified PODs" value="1,280" colorClass="text-green-600" icon={FileCheck} />
          <DeliveryStatCard label="Pending Approval" value="115" colorClass="text-amber-600" icon={Clock} />
          <DeliveryStatCard label="Disputed" value="25" colorClass="text-red-600" icon={AlertCircle} />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search POD Number, Recipient or Stop ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#0052CC] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50">
                <Filter size={16} /> Filter Status
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">POD / Record</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recipient & Location</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Delivery Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveries.map((pod) => (
                  <tr key={pod.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                          <Hash size={14} className="text-gray-400" /> {pod.pod_number}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                          Stop: {pod.trip_stop}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
                          <User size={14} className="text-[#0052CC]" /> {pod.received_by}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                          <MapPin size={12} /> {pod.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Calendar size={14} className="text-gray-400" /> {pod.delivery_date}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <StatusBadge status={pod.status} />
                        {pod.has_images && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase">
                            <ImageIcon size={12} /> Photo Attached
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Verify POD">
                          <FileCheck size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Total 1,420 POD Records
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs font-bold border border-gray-200 rounded hover:bg-white transition-colors">Prev</button>
              <button className="px-3 py-1 text-xs font-bold bg-[#0052CC] text-white rounded">1</button>
              <button className="px-3 py-1 text-xs font-bold border border-gray-200 rounded hover:bg-white transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}