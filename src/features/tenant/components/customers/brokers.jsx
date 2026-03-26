import React, { useState } from 'react';
import {
  Search, Plus, Download, RefreshCw, Eye, Upload, RotateCcw,
  Users, CheckCircle, AlertCircle, PauseCircle,
  ChevronDown, Loader2, AlertTriangle, Briefcase, Pencil
} from 'lucide-react';
import { StatCard } from '../Vehicles/Common/VehicleCommon';

const INITIAL_BROKERS = [
  { id: 'BRK-001', name: 'FastLink Logistics Brokers', code: 'BRK-FL-001', type: 'BROKER', tier: 'PLATINUM', credit: 1000000, status: 'ACTIVE' },
  { id: 'BRK-002', name: 'Apex Freight Solutions', code: 'BRK-AFS-002', type: 'BROKER', tier: 'GOLD', credit: 2000000, status: 'ACTIVE' },
  { id: 'BRK-003', name: 'Translink Mediators Pvt Ltd', code: 'BRK-TMP-003', type: 'BROKER', tier: 'GOLD', credit: 800000, status: 'ACTIVE' },
  { id: 'BRK-004', name: 'Bridge Cargo Brokers', code: 'BRK-BCB-004', type: 'BROKER', tier: 'SILVER', credit: 600000, status: 'ACTIVE' },
  { id: 'BRK-005', name: 'Global Port Intermediaries', code: 'BRK-GPI-005', type: 'BROKER', tier: 'STANDARD', credit: 250000, status: 'SUSPENDED' },
];

const STATUS_STYLES = {
  'ACTIVE': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'INACTIVE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const BrokersDashboard = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');

  const brokers = INITIAL_BROKERS.filter(c => {
    const matchesSearch = !search || [c.name, c.code].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = INITIAL_BROKERS.length;
  const active = INITIAL_BROKERS.filter(c => c.status === 'ACTIVE').length;
  const inactive = INITIAL_BROKERS.filter(c => c.status === 'INACTIVE').length;
  const suspended = INITIAL_BROKERS.filter(c => c.status === 'SUSPENDED').length;

  const resetFilters = () => { setSearch(''); setStatus(''); };

  const COLUMNS = [
    {
      header: 'Legal Name',
      render: c => (
        <div className="text-left">
          <button className="font-bold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left block">
            {c.name ?? '—'}
          </button>
          <div className="text-[11px] font-mono text-gray-400">{c.code ?? ''}</div>
        </div>
      ),
    },

    {
      header: 'Tier',
      render: c => (
        <span className="text-[12px] font-bold text-gray-700">
          {c.tier ?? '—'}
        </span>
      ),
    },
    {
      header: 'Credit Limit',
      render: c => (
        <span className="font-bold text-gray-700 text-[13px]">
          {c.credit ? `₹${Number(c.credit).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: c => {
        const st = getStatusStyle(c.status);
        return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {c.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: c => (
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
            <Pencil size={12} /> Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* Header */}
      <div className="flex items-center">
        <div className="w-1/4">
          <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Brokers</h1>
          <p className="text-gray-500 text-sm tracking-tight mt-0.5">All registered brokers and commission structures</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 group">
            <RefreshCw size={14} /><span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
            <Upload size={14} /><span>Import</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
            <Download size={14} /><span>Export</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0 mt-2">
        {/* Stats + Add Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
            <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
            <span className="text-[18px] font-black text-green-600">{active}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
            <span className="text-[18px] font-black text-orange-500">{inactive}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Suspended:</span>
            <span className="text-[18px] font-black text-red-500">{suspended}</span>
          </div>
          <div className="ml-auto">
            <button className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
              <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" /> Add Broker
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 bg-white flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search broker name, code..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-100 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] font-medium" />
          </div>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="py-1.5 px-3 text-xs border border-gray-100 rounded-lg bg-gray-50 focus:outline-none font-medium text-[#172B4D] cursor-pointer">
            <option value="">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          {(search || statusFilter) && (
            <button onClick={resetFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear">
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm relative">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                {COLUMNS.map(c => (
                  <th key={c.header} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brokers.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                  {COLUMNS.map(col => (
                    <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(c)}</td>
                  ))}
                </tr>
              ))}
              {brokers.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                    <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No brokers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>
            Showing <span className="font-bold text-gray-600">{brokers.length}</span> of <span className="font-bold text-gray-600">{total}</span> brokers
          </span>
          <span className="text-[11px]">Fleet Management System</span>
        </div>
      </div>
    </div>
  );
};

export default BrokersDashboard;