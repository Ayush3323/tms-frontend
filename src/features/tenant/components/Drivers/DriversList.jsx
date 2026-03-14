import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, RefreshCw, Eye,
  PauseCircle, PlayCircle, ChevronDown,
  Loader2, AlertCircle, UserCheck, Users,
  UserX, UserMinus, IdCard,
} from 'lucide-react';
import { useDrivers, useUpdateDriver } from '../../queries/drivers/driverCoreQuery';

// ── Style Maps ────────────────────────────────────────────────────────

const STATUS_STYLES = {
  ACTIVE:     { dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  INACTIVE:   { dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-50 border border-gray-200' },
  ON_LEAVE:   { dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50 border border-blue-200' },
  SUSPENDED:  { dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  TERMINATED: { dot: 'bg-gray-600',   text: 'text-gray-700',   bg: 'bg-gray-100 border border-gray-300' },
};

const LICENSE_COLORS = {
  HMV:           'bg-purple-50 text-purple-700 border border-purple-200',
  LMV:           'bg-blue-50 text-blue-700 border border-blue-200',
  TRANSPORT:     'bg-orange-50 text-orange-700 border border-orange-200',
  MMV:           'bg-teal-50 text-teal-700 border border-teal-200',
  LEARNER:       'bg-yellow-50 text-yellow-700 border border-yellow-200',
  INTERNATIONAL: 'bg-green-50 text-green-700 border border-green-200',
};

const DRIVER_TYPE_COLORS = {
  PERMANENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  CONTRACT:  'bg-orange-50 text-orange-700 border border-orange-200',
  TEMPORARY: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  PART_TIME: 'bg-gray-50 text-gray-600 border border-gray-200',
};

// ── Expiry Color Helper ───────────────────────────────────────────────
const getExpiryColor = (dateStr) => {
  if (!dateStr) return 'text-gray-400';
  const today = new Date();
  const expiry = new Date(dateStr);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return 'text-red-600 font-semibold';   // expired
  if (diffDays < 90)  return 'text-orange-500 font-semibold'; // expiring soon
  return 'text-green-600 font-semibold';                      // ok
};

// ── Driver Name Helper ────────────────────────────────────────────────
// Jab backend first_name/last_name add kare → auto show hoga
const getDriverName = (driver) => {
  if (driver.first_name && driver.last_name) {
    return `${driver.first_name} ${driver.last_name}`;
  }
  return driver.employee_id; // fallback jab tak naam nahi aata
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.iconBg}`}>
        <Icon size={15} className={color.iconText} />
      </span>
    </div>
    {loading
      ? <div className="h-9 w-12 bg-gray-100 rounded animate-pulse" />
      : <span className={`text-3xl font-black ${color.value}`}>{value}</span>
    }
  </div>
);

// ── Main Component ────────────────────────────────────────────────────
const DriversList = () => {
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [typeFilter,   setType]       = useState('');
  const [licFilter,    setLic]        = useState('');
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useDrivers({
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter   && { driver_type: typeFilter }),
    ...(licFilter    && { license_type: licFilter }),
    ...(search       && { search }),
  });

  const updateDriver = useUpdateDriver();

  const drivers    = data?.results ?? [];
  const total      = data?.count ?? drivers.length;
  const active     = drivers.filter(d => d.status === 'ACTIVE').length;
  const inactive   = drivers.filter(d => d.status === 'INACTIVE').length;
  const suspended  = drivers.filter(d => d.status === 'SUSPENDED').length;

  const handleStatusToggle = (driver) => {
    const newStatus = driver.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateDriver.mutate({ id: driver.id, data: { status: newStatus } });
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setType(''); setLic('');
  };

  // ── Table Columns ─────────────────────────────────────────────────
  const COLUMNS = [
    {
      header: 'Driver',
      render: d => (
        <div>
          <span className="font-bold text-[#172B4D] text-[13px]">
            {getDriverName(d)}
          </span>
          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
            {d.employee_id}
          </div>
        </div>
      ),
    },
    {
      header: 'License No.',
      render: d => (
        <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          {d.license_number ?? '—'}
        </span>
      ),
    },
    {
      header: 'License Type',
      render: d => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${LICENSE_COLORS[d.license_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {d.license_type_display ?? d.license_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Driver Type',
      render: d => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${DRIVER_TYPE_COLORS[d.driver_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {d.driver_type_display ?? d.driver_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Expiry',
      render: d => (
        <span className={`text-[12px] font-mono ${getExpiryColor(d.license_expiry)}`}>
          {d.license_expiry ?? '—'}
        </span>
      ),
    },
    {
      header: 'Experience',
      render: d => (
        <span className="text-gray-600 text-[12px]">
          {d.years_of_experience != null ? `${d.years_of_experience} yrs` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: d => {
        const st = STATUS_STYLES[d.status] ?? STATUS_STYLES.INACTIVE;
        return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {d.status_display ?? d.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: d => {
        const isActive    = d.status === 'ACTIVE';
        const isSuspended = d.status === 'SUSPENDED';
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/tenant/dashboard/drivers/${d.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all"
            >
              <Eye size={12} /> View
            </button>
            {isActive && (
              <button
                onClick={() => handleStatusToggle(d)}
                disabled={updateDriver.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <PauseCircle size={12} /> Suspend
              </button>
            )}
            {isSuspended && (
              <button
                onClick={() => handleStatusToggle(d)}
                disabled={updateDriver.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
              >
                <PlayCircle size={12} /> Activate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Drivers</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered drivers — click{' '}
            <span className="text-[#0052CC] font-semibold">View</span> for complete profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Driver
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total Drivers" value={total}     icon={Users}      color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard loading={isLoading} label="Active"        value={active}    icon={UserCheck}  color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard loading={isLoading} label="Inactive"      value={inactive}  icon={UserMinus}  color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
        <StatCard loading={isLoading} label="Suspended"     value={suspended} icon={UserX}      color={{ value: 'text-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-400' }} />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Table Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">🧑‍✈️ Driver Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click View to see complete driver profile</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Driver
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee ID, license number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50"
            />
          </div>

          {[
            {
              val: statusFilter, set: setStatus,
              opts: ['ACTIVE','INACTIVE','ON_LEAVE','SUSPENDED','TERMINATED'],
              ph: 'All Status',
            },
            {
              val: typeFilter, set: setType,
              opts: ['PERMANENT','CONTRACT','TEMPORARY','PART_TIME'],
              ph: 'All Types',
            },
            {
              val: licFilter, set: setLic,
              opts: ['HMV','LMV','MMV','TRANSPORT','LEARNER','INTERNATIONAL'],
              ph: 'All Licenses',
            },
          ].map(({ val, set, opts, ph }) => (
            <div key={ph} className="relative">
              <select
                value={val}
                onChange={e => set(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer"
              >
                <option value="">{ph}</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
          >
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-[#0052CC]" />
            <span className="text-sm">Loading drivers...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">Failed to load drivers</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map(c => (
                    <th
                      key={c.header}
                      className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map(c => (
                      <td key={c.header} className="px-4 py-3 whitespace-nowrap align-middle">
                        {c.render(d)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Empty State */}
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                      <IdCard size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No drivers found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing{' '}
              <span className="font-bold text-gray-600">{drivers.length}</span>
              {data?.count && data.count !== drivers.length && (
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              )}{' '}
              drivers
            </span>
            <span className="text-[11px]">Fleet Management System</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversList;