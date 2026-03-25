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
  const [currentPage, setCurrentPage] = useState(1);
  const [formModal, setFormModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useVehicles({
    page: currentPage,
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

  const resetFilters = () => { setSearch(''); setStatus(''); setFuel(''); setOwner(''); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Registration',
      render: v => (
        <div className="text-left">
          <button onClick={() => setViewModal(v)}
            className="font-bold text-[#172B4D] font-mono text-[14px] hover:text-[#0052CC] transition-all text-left block hover:underline decoration-blue-400/30 underline-offset-4">
            {v.registration_number ?? '—'}
          </button>
        </div>
      ),
    },
    {
      header: 'Make',
      render: v => (
        <div>
          <span className="text-[13px] font-semibold text-gray-800">{v.make ?? '—'}</span>
        </div>
      ),
    },
    {
      header: 'Vehicle Type',
      render: v => (
        <span className="text-[13px] font-semibold text-gray-700">
          {v.vehicle_type_name ?? v.vehicle_type?.type_name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Fuel Type',
      render: v => (
        <span className={`px-2 py-0.5 rounded-md text-[13px] font-bold w-fit ${FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
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
    <main className="p-6 bg-[#F4F5F7] flex-1 flex flex-col min-h-0 overflow-hidden relative">

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
      <div className="flex justify-between items-start mb-8">

        {/* LEFT */}
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicles</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered vehicles — click <span className="text-[#0052CC] font-semibold">View</span> for full details
          </p>
        </div>

        {/* RIGHT SIDE ALL BUTTONS */}
        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate('/tenant/dashboard/vehicles/types')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all"
          >
            <LayoutGrid size={14} /> Vehicle Types
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download size={14} /> Export
          </button>

          <button
            onClick={() => setFormModal('add')}
            className="bg-[#0052CC] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6]"
          >
            <Plus size={18} /> Add Vehicle
          </button>

        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">


        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
          <div className="flex gap-3 items-center flex-wrap flex-1">
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search registration, make, model..."
                value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
            </div>
            {[
              { val: statusFilter, set: setStatus, opts: ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'SOLD', 'SCRAPPED'], ph: 'All Status' },
              { val: fuelFilter, set: setFuel, opts: ['DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID'], ph: 'All Fuel' },
              { val: ownerFilter, set: setOwner, opts: ['OWNED', 'LEASED', 'RENTED'], ph: 'All Ownership' },
            ].map(({ val, set, opts, ph }) => (
              <div key={ph} className="relative">
                <select value={val} onChange={e => { set(e.target.value); setCurrentPage(1); }}
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Previous
            </button>
            <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
              {currentPage}
            </div>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!data?.next || isLoading}
              className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Next
            </button>
          </div>
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
          <div className="flex-1 min-h-0 overflow-auto bg-white">
            <table className="w-full text-left relative">
              <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="px-4 py-4">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors group">
                    {COLUMNS.map(c => (
                      <td key={c.header} className="px-6 py-4 whitespace-nowrap align-middle">{c.render(v)}</td>
                    ))}
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-6 py-10 text-center text-gray-500 font-medium">
                      <Truck size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No vehicles found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white shrink-0">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{vehicles.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> vehicles
            </div>
          </div>
        )}
      </div>

    </main>
  );
};

export default Vehicles;
