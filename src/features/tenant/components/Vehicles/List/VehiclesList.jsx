import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, RefreshCw, Eye, PauseCircle,
  PlayCircle, Truck, CheckCircle, Wrench, ArchiveX,
  ChevronDown, Loader2, AlertCircle, X, RotateCcw,
  Pencil, LayoutGrid
} from 'lucide-react';
import { useVehicles, useVehicle, useUpdateVehicle, useRestoreVehicle, useVehicleStats } from '../../../queries/vehicles/vehicleQuery';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [fuelFilter, setFuel] = useState('');
  const [ownerFilter, setOwner] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('active'); // active | deleted | all
  const [currentPage, setCurrentPage] = useState(1);
  const [formModal, setFormModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const navigate = useNavigate();

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useVehicles({
    page: currentPage,
    ...(statusFilter && { status: statusFilter }),
    ...(fuelFilter && { fuel_type: fuelFilter }),
    ...(ownerFilter && { ownership_type: ownerFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(visibilityFilter === 'deleted' && { deleted_only: true }),
    ...(visibilityFilter === 'all' && { include_deleted: true }),
  });

  const updateVehicle = useUpdateVehicle();
  const restoreVehicle = useRestoreVehicle();
  const { data: statsData } = useVehicleStats();
  const vehicles = data?.results ?? data ?? [];
  const total = statsData?.total ?? data?.count ?? vehicles.length;
  const active = statsData?.active ?? vehicles.filter(v => !v.is_deleted && v.status === 'ACTIVE').length;
  const maintenance = statsData?.maintenance ?? vehicles.filter(v => !v.is_deleted && v.status === 'MAINTENANCE').length;
  const retired = statsData?.retired ?? vehicles.filter(v => !v.is_deleted && ['RETIRED', 'SOLD', 'SCRAPPED'].includes(v.status)).length;
  const deleted = statsData?.deleted ?? vehicles.filter(v => v.is_deleted).length;

  const handleStatusToggle = (v) =>
    updateVehicle.mutate({ id: v.id, data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } });

  const resetFilters = () => {
    setSearchTerm('');
    setStatus('');
    setFuel('');
    setOwner('');
    setVisibilityFilter('active');
    setCurrentPage(1);
  };

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
        if (v.is_deleted) {
          return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap bg-red-50 border border-red-200 text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Deleted
            </span>
          );
        }
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
        if (v.is_deleted) {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/tenant/dashboard/vehicles/${v.id}`)}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                <Eye size={12} /> View
              </button>
              <button
                onClick={() => restoreVehicle.mutate(v.id)}
                disabled={restoreVehicle.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
              >
                {restoreVehicle.isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Restore
              </button>
            </div>
          );
        }

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

      {/* Page Title & Search Section */}
      <div className="flex items-center mb-8">
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Vehicles</h2>
          <p className="text-gray-500 text-sm tracking-tight">All registered vehicles — click <span className="text-[#0052CC] font-semibold">View</span></p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search registration, make, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => navigate('/tenant/dashboard/vehicles/types')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
            >
              <LayoutGrid size={14} /> Types
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Maintenance:</span>
                <span className="text-[18px] font-black text-orange-500">{maintenance}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Retired/Sold:</span>
                <span className="text-[18px] font-black text-red-500">{retired}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Deleted:</span>
                <span className="text-[18px] font-black text-red-600">{deleted}</span>
              </div>
            </>
          )}
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={() => setFormModal('add')}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Vehicle
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-6 ml-auto justify-between h-15 border-b border-gray-50">
            {/* Quick Filters in Pagination Row */}
            <div className="flex items-center gap-3 px-5 py-2">
              <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                {[
                  { id: 'active', label: 'Active' },
                  { id: 'deleted', label: 'Deleted' },
                  { id: 'all', label: 'All' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setVisibilityFilter(opt.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${visibilityFilter === opt.id
                      ? 'bg-[#0052CC] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {[
                { val: statusFilter, set: setStatus, opts: ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'SOLD', 'SCRAPPED'], ph: 'All Status' },
                { val: fuelFilter, set: setFuel, opts: ['DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID'], ph: 'All Fuel' },
                { val: ownerFilter, set: setOwner, opts: ['OWNED', 'LEASED', 'RENTED'], ph: 'All Ownership' },
              ].map(({ val, set, opts, ph }) => (
                <div key={ph} className="relative">
                  <select value={val} onChange={e => { set(e.target.value); setCurrentPage(1); }}
                    disabled={visibilityFilter === 'deleted' && ph === 'All Status'}
                    className="appearance-none pl-3 pr-8 py-1.5 text-s  text-[#172B4D] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
                    <option value="">{ph}</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              ))}

              {(statusFilter || fuelFilter || ownerFilter || visibilityFilter !== 'active') && (
                <button
                  onClick={resetFilters}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear Filters"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block" />

            <div className="flex items-center justify-between gap-3 px-5 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>

              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {currentPage}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!data?.next || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>
          <div className="px-5 py-2 border-b border-gray-50 bg-blue-50/40">
            <p className="text-[11px] text-gray-600">
              <span className="font-bold text-[#172B4D]">Note:</span> Active/Maintenance/Retired are live vehicle states. Deleted means archived (soft-deleted).
            </p>
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
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D]">{vehicles.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> vehicles
              </div>
            </div>
          </div>
        )}
      </div>

    </main>
  );
};

export default Vehicles;
