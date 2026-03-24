import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, RefreshCw, Eye, PauseCircle,
  PlayCircle, Truck, CheckCircle, Wrench, ArchiveX,
  ChevronDown, Loader2, AlertCircle, X,
  Pencil, LayoutGrid
} from 'lucide-react';
import { useVehicles, useVehicle, useUpdateVehicle, useCreateVehicle } from '../../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../../queries/vehicles/vehicletypeQuery';

import {
  VehicleFormModal
} from '../Common/VehicleFormModal';
import {
  StatCard, FUEL_COLORS, STATUS_STYLES, OWNERSHIP_COLORS, fmtKm
} from '../Common/VehicleCommon';
import { TableShimmer, CardShimmer, ErrorState } from '../Common/StateFeedback';

// ── Edit Button with full data fetch ─────────────────────────────────
const EditVehicleButton = ({ vehicleId, onEdit }) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const { data, isLoading } = useVehicle(vehicleId, { enabled: shouldFetch });

  useEffect(() => {
    if (data && shouldFetch) {
      setShouldFetch(false);
      onEdit(data);
    }
  }, [data, shouldFetch]);

  const handleClick = () => setShouldFetch(true);

  return (
    <button onClick={handleClick} disabled={isLoading}
      className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50">
      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
      Edit
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────────────
const Vehicles = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [fuelFilter, setFuel] = useState('');
  const [ownerFilter, setOwner] = useState('');
  const [formModal, setFormModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useVehicles({
    ...(statusFilter && { status: statusFilter }),
    ...(fuelFilter && { fuel_type: fuelFilter }),
    ...(ownerFilter && { ownership_type: ownerFilter }),
    ...(search && { search }),
  });

  const updateVehicle = useUpdateVehicle();
  const vehicles = data?.results ?? data ?? [];
  const total = data?.count ?? vehicles.length;
  const active = vehicles.filter(v => v.status === 'ACTIVE').length;
  const maintenance = vehicles.filter(v => v.status === 'MAINTENANCE').length;
  const retired = vehicles.filter(v => ['RETIRED', 'SOLD', 'SCRAPPED'].includes(v.status)).length;

  const handleStatusToggle = (v) =>
    updateVehicle.mutate({ id: v.id, data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } });

  const resetFilters = () => { setSearch(''); setStatus(''); setFuel(''); setOwner(''); };

  const COLUMNS = [
    {
      header: 'Registration',
      render: v => (
        <div className="text-left">
          <button onClick={() => setViewModal(v)}
            className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left block hover:underline decoration-blue-400/30 underline-offset-4">
            {v.registration_number ?? '—'}
          </button>
        </div>
      ),
    },
    {
      header: 'Make',
      render: v => (
        <div>
          <span className="font-semibold text-gray-800">{v.make ?? '—'}</span>
        </div>
      ),
    },
    {
      header: 'Vehicle Type',
      render: v => (
        <span className="text-[12px] font-semibold text-gray-700">
          {v.vehicle_type_name ?? v.vehicle_type?.type_name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Fuel Type',
      render: v => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold w-fit ${FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
          {v.fuel_type_display ?? v.fuel_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Odometer',
      render: v => (
        <span className="text-gray-600 font-mono text-[12px]">
          {fmtKm(v.current_odometer)}
        </span>
      ),
    },
    {
      header: 'Ownership',
      render: v => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${OWNERSHIP_COLORS[v.ownership_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {v.ownership_type_display ?? v.ownership_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: v => {
        const st = STATUS_STYLES[v.status] ?? STATUS_STYLES.RETIRED;
        return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {v.status_display ?? v.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: v => {
        const isActive = v.status === 'ACTIVE';
        const isMaint = v.status === 'MAINTENANCE';
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/tenant/dashboard/vehicles/${v.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
              <Eye size={12} /> View
            </button>
            {isActive && (
              <button onClick={() => handleStatusToggle(v)} disabled={updateVehicle.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50">
                <PauseCircle size={12} /> Suspend
              </button>
            )}
            {isMaint && (
              <button onClick={() => handleStatusToggle(v)} disabled={updateVehicle.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50">
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

      {formModal && (
        <VehicleFormModal
          initial={formModal === 'add' ? null : formModal}
          onClose={() => setFormModal(null)}
        />
      )}
      {viewModal && (
        <VehicleFormModal
          initial={viewModal}
          isView
          onClose={() => setViewModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicles</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered vehicles — click <span className="text-[#0052CC] font-semibold">View</span> for full details
          </p>
        </div>
        <button onClick={() => navigate('/tenant/dashboard/vehicles/types')}
          className=" ml-auto mr-4 flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg">
          <LayoutGrid size={14} /> Vehicle Types
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <Download size={14} /> Export
          </button>

        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {isLoading ? (
          <CardShimmer count={4} />
        ) : (
          <>
            <StatCard loading={isLoading} label="Total" value={total} icon={Truck} color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50', iconText: 'text-blue-500' }} />
            <StatCard loading={isLoading} label="Active" value={active} icon={CheckCircle} color={{ value: 'text-green-600', iconBg: 'bg-green-50', iconText: 'text-green-500' }} />
            <StatCard loading={isLoading} label="Maintenance" value={maintenance} icon={Wrench} color={{ value: 'text-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-500' }} />
            <StatCard loading={isLoading} label="Retired / Sold" value={retired} icon={ArchiveX} color={{ value: 'text-red-500', iconBg: 'bg-red-50', iconText: 'text-red-400' }} />
          </>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">🚛 Vehicle Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click View to see complete vehicle profile</p>
          </div>

          <button onClick={() => setFormModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Vehicle
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search registration, make, model..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          {[
            { val: statusFilter, set: setStatus, opts: ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'SOLD', 'SCRAPPED'], ph: 'All Status' },
            { val: fuelFilter, set: setFuel, opts: ['DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID'], ph: 'All Fuel' },
            { val: ownerFilter, set: setOwner, opts: ['OWNED', 'LEASED', 'RENTED'], ph: 'All Ownership' },
          ].map(({ val, set, opts, ph }) => (
            <div key={ph} className="relative">
              <select value={val} onChange={e => set(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
                <option value="">{ph}</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
          <button onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {isLoading && (
          <div className="p-4">
            <TableShimmer rows={8} cols={COLUMNS.length} />
          </div>
        )}

        {isError && (
          <ErrorState
            message="Failed to load vehicles"
            error={error?.response?.data?.detail || error?.message}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 310px)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map(c => (
                      <td key={c.header} className="px-4 py-3 whitespace-nowrap align-middle">{c.render(v)}</td>
                    ))}
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                      <Truck size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No vehicles found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing <span className="font-bold text-gray-600">{vehicles.length}</span>
              {data?.count && data.count !== vehicles.length &&
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              } vehicles
            </span>
            <span className="text-[11px]">Fleet Management System</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
