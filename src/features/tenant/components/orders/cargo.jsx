import React, { useState } from 'react';
import { 
  Package, Plus, Search, Filter, Download, 
  MoreHorizontal, Eye, Edit2, Trash2, 
  Layers, Scale, Maximize, Move,
  Hash, RefreshCcw, AlertCircle, CheckCircle2
} from 'lucide-react';

// --- Configuration & Helpers ---
const CARGO_TYPE_COLORS = {
  HAZMAT: 'bg-red-100 text-red-700 border-red-200',
  PERISHABLE: 'bg-teal-100 text-teal-700 border-teal-200',
  FRAGILE: 'bg-amber-100 text-amber-700 border-amber-200',
  GENERAL: 'bg-blue-100 text-blue-700 border-blue-200',
};

// --- Sub-components ---
const CargoStatCard = ({ label, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${colorClass}`}>{value}</h3>
        <p className="text-[10px] text-gray-500 font-medium mt-1">{subtext}</p>
      </div>
      <div className={`p-3 rounded-lg ${colorClass.replace('text', 'bg')}/10`}>
        <Icon className={colorClass} size={20} />
      </div>
    </div>
  </div>
);

// --- Main Body Component ---
export default function CargoMainBody() {
  const [search, setSearch] = useState("");

  // Mock data based on your CargoDashboard.jsx
  const cargoItems = [
    { 
      id: "cgo-001", 
      item_code: "ITM-99210", 
      description: "Industrial Components", 
      cargo_type: "GENERAL",
      weight: "450.50 kg",
      dimensions: "120x80x100 cm",
      trip_id: "TRIP-2026-001",
      status: "LOADED"
    },
    { 
      id: "cgo-002", 
      item_code: "ITM-44120", 
      description: "Medical Supplies", 
      cargo_type: "FRAGILE",
      weight: "120.00 kg",
      dimensions: "60x60x60 cm",
      trip_id: "TRIP-2026-002",
      status: "IN_TRANSIT"
    },
    { 
      id: "cgo-003", 
      item_code: "ITM-88211", 
      description: "Chemical Drums", 
      cargo_type: "HAZMAT",
      weight: "1200.00 kg",
      dimensions: "200x200x150 cm",
      trip_id: "TRIP-2026-005",
      status: "PENDING"
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      <div className="p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Cargo Inventory</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage individual cargo items, dimensions, and loading details.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={16} /> Export manifest
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#4a6cf7] text-white rounded-lg text-sm font-bold hover:bg-[#3b59d9] shadow-md shadow-blue-200 transition-all">
              <Plus size={18} /> Add Cargo Item
            </button>
          </div>
        </div>

        {/* Cargo Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CargoStatCard label="Total Items" value="842" subtext="In current month" colorClass="text-blue-600" icon={Package} />
          <CargoStatCard label="Total Weight" value="12,450 kg" subtext="Across all trips" colorClass="text-indigo-600" icon={Scale} />
          <CargoStatCard label="Loaded Items" value="612" subtext="72% Efficiency" colorClass="text-green-600" icon={CheckCircle2} />
          <CargoStatCard label="Hazmat Alerts" value="04" subtext="Requires attention" colorClass="text-red-600" icon={AlertCircle} />
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search Item Code, Description or Trip ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#4a6cf7] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
                <Filter size={16} /> Filters
              </button>
              <button className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-[#4a6cf7] transition-colors">
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          {/* Cargo Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Item / Code</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Specifications</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip Link</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cargoItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-blue-100 group-hover:text-[#4a6cf7] transition-colors">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#172B4D]">{item.description}</p>
                          <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5 uppercase">
                            <Hash size={10} /> {item.item_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                          <Scale size={14} className="text-gray-400" /> {item.weight}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                          <Maximize size={14} className="text-gray-400" /> {item.dimensions}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-bold text-gray-600 uppercase tracking-tight">
                        <Move size={12} /> {item.trip_id}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${CARGO_TYPE_COLORS[item.cargo_type]}`}>
                        {item.cargo_type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                          <Edit2 size={16} />
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

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Total 156 items found
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded text-gray-500 hover:bg-white">Prev</button>
              <button className="px-3 py-1.5 text-xs font-bold bg-[#4a6cf7] text-white rounded">1</button>
              <button className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded text-gray-500 hover:bg-white">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}