import React, { useState } from 'react';
import {
  Search, Plus, Download, RefreshCw, Eye,
  Users, CheckCircle, AlertCircle, PauseCircle,
  ChevronDown, Loader2, AlertTriangle, Briefcase, Pencil
} from 'lucide-react';
import { StatCard } from '../Vehicles/Common/VehicleCommon';

const INITIAL_BROKERS = [
  {id:'BRK-001', name:'FastLink Logistics Brokers', code:'BRK-FL-001', type:'BROKER', tier:'PLATINUM', credit:1000000, status:'ACTIVE'},
  {id:'BRK-002', name:'Apex Freight Solutions', code:'BRK-AFS-002', type:'BROKER', tier:'GOLD', credit:2000000, status:'ACTIVE'},
  {id:'BRK-003', name:'Translink Mediators Pvt Ltd', code:'BRK-TMP-003', type:'BROKER', tier:'GOLD', credit:800000, status:'ACTIVE'},
  {id:'BRK-004', name:'Bridge Cargo Brokers', code:'BRK-BCB-004', type:'BROKER', tier:'SILVER', credit:600000, status:'ACTIVE'},
  {id:'BRK-005', name:'Global Port Intermediaries', code:'BRK-GPI-005', type:'BROKER', tier:'STANDARD', credit:250000, status:'SUSPENDED'},
];

const STATUS_STYLES = {
  'ACTIVE':    { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  'INACTIVE':  { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const BrokersDashboard = () => {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');

  const brokers = INITIAL_BROKERS.filter(c => {
    const matchesSearch = !search || [c.name, c.code].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total     = INITIAL_BROKERS.length;
  const active    = INITIAL_BROKERS.filter(c => c.status === 'ACTIVE').length;
  const inactive  = INITIAL_BROKERS.filter(c => c.status === 'INACTIVE').length;
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
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Brokers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered brokers — click <span className="text-[#0052CC] font-semibold">View</span> for full details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Broker
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total"     value={total}     icon={Users}       color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard label="Active"    value={active}    icon={CheckCircle} color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard label="Inactive"  value={inactive}  icon={AlertCircle} color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
        <StatCard label="Suspended" value={suspended} icon={PauseCircle} color={{ value: 'text-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-400' }} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">💼 Broker Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage broker profiles and commission structures</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Broker
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search broker name, code..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
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