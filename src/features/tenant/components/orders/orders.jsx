import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, Download, 
  MoreHorizontal, Eye, Edit2, Truck, XCircle, 
  Trash2, Calendar, ChevronRight, Package,
  CheckCircle2, Clock, AlertCircle, RefreshCcw
} from 'lucide-react';

// --- Configuration & Helpers (Based on your OrdersDashboard.jsx) ---
const STATUS_CONFIG = {
  DRAFT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  CONFIRMED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Truck size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <Package size={14} /> },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <XCircle size={14} /> },
};

const TYPE_COLORS = {
  FTL: 'bg-purple-100 text-purple-700',
  LTL: 'bg-indigo-100 text-indigo-700',
  CONTAINER: 'bg-cyan-100 text-cyan-700',
  COURIER: 'bg-orange-100 text-orange-700',
  MULTI_DROP: 'bg-pink-100 text-pink-700',
};

// --- Sub-components ---
const StatCard = ({ label, value, colorClass, icon: Icon, emoji }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-3xl font-extrabold ${colorClass}`}>{value}</h3>
      </div>
    </div>
    <div className="text-3xl opacity-20">{emoji}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="text-[11px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// --- Main Body Component ---
export default function OrdersMainBody() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");

  // Mock data for demo
  const orders = [
    { id: "ord-001", lr_number: "LR-DEMO-0001", reference: "PO-2024-001", type: "FTL", status: "CONFIRMED", customer: "Reliance Ind.", pickup: "2026-03-12" },
    { id: "ord-002", lr_number: "LR-DEMO-0002", reference: "PO-2024-002", type: "LTL", status: "IN_TRANSIT", customer: "Tata Motors", pickup: "2026-03-13" },
    { id: "ord-006", lr_number: "LR-DEMO-0006", reference: "PO-2024-006", type: "MULTI_DROP", status: "ASSIGNED", customer: "Amazon IN", pickup: "2026-03-20" },
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      {/* Page Header (No sidebar/header, only page title) */}
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Orders (LR) Management</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage Lorry Receipts, shipments, and trip assignments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={16} /> Export
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#4a6cf7] text-white rounded-lg text-sm font-bold hover:bg-[#3b59d9] shadow-md shadow-blue-200 transition-all">
              <Plus size={18} /> Add Order
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Orders" value="1,284" colorClass="text-[#4a6cf7]" emoji="📦" />
          <StatCard label="Confirmed" value="412" colorClass="text-[#43a047]" emoji="✅" />
          <StatCard label="In Transit" value="89" colorClass="text-[#ffa000]" emoji="🚛" />
          <StatCard label="Cancelled" value="12" colorClass="text-[#e53935]" emoji="🚫" />
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header & Search */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-white">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search LR number, reference..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#4a6cf7] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="flex-1 md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#4a6cf7]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option>All Status</option>
                <option>DRAFT</option>
                <option>CONFIRMED</option>
                <option>ASSIGNED</option>
                <option>IN_TRANSIT</option>
              </select>
              <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#4a6cf7] hover:bg-blue-50 transition-colors">
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Order / LR ↕</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Reference</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Pickup Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#4a6cf7] font-bold text-xs">
                          {order.lr_number.slice(-2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#172B4D]">{order.lr_number}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{order.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#4a6cf7]">{order.reference}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${TYPE_COLORS[order.type] || 'bg-gray-100'}`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{order.pickup}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Showing {orders.length} of 1,284 Orders</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Prev</button>
              <button className="px-3 py-1 border border-gray-200 rounded bg-[#4a6cf7] text-white">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}