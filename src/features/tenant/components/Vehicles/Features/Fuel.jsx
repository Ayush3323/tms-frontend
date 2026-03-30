import React, { useState, useMemo } from 'react';
import {
  Fuel, Plus, Edit2, Trash2, X,
  RotateCcw, Loader2, AlertCircle, Calendar,
  IndianRupee, Zap, Gauge, MapPin, Pencil, Search,
  Download, Upload, Eye, ChevronDown
} from 'lucide-react';
import {
  useVehicleFuelLog,
  useVehicleFuelLogs,
  useCreateFuelLog,
  useUpdateFuelLog,
  useDeleteFuelLog,
} from '../../../queries/vehicles/vehicleInfoQuery';
import { useTrips } from '../../../queries/orders/ordersQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  FUEL_COLORS, fmtDate, fmtINR, fmtKm
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, AreaChart, Area
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────
const FUEL_TYPE_OPTIONS = [
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'PETROL', label: 'Petrol' },
  { value: 'CNG', label: 'CNG' },
  { value: 'LPG', label: 'LPG' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
];



const EMPTY_FORM = {
  vehicle: '', fuel_date: '', fuel_type: '',
  quantity_liters: '', cost_per_liter: '', total_cost: '',
  odometer_reading: '', fuel_station: '', notes: '',
  trip_id: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FormSec = ({ title }) => (
  <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest pt-2 pb-1 border-b border-blue-50 mb-2">
    {title}
  </p>
);


// ─── Components ───────────────────────────────────────────────────────────────
const ViewDetail = ({ data, onClose }) => {
  const { data: tripData } = useTrips({ page_size: 1000 });
  const trips = tripData?.results || [];
  const trip = trips.find(t => t.id === data.trip_id);

  const tripDisplay = trip
    ? `${trip.trip_number} | ${trip.origin} → ${trip.destination} (${trip.status})`
    : data.trip_id || '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <InfoCard label="Fuel Type" value={
          <Badge className={FUEL_COLORS[data.fuel_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
            <span className={`w-1.5 h-1.5 rounded-full ${FUEL_COLORS[data.fuel_type]?.includes('orange') ? 'bg-orange-500' : 'bg-blue-500'}`} />
            {data.fuel_type_display ?? data.fuel_type}
          </Badge>
        } />
        <InfoCard label="Date" value={fmtDate(data.fuel_date)} icon={Calendar} />
        <InfoCard label="Quantity" value={data.quantity_liters ? `${data.quantity_liters} L` : '—'} icon={Fuel} />
        <InfoCard label="Total Cost" value={fmtINR(data.total_cost)} icon={IndianRupee} accent />
        <InfoCard label="Per Litre" value={data.cost_per_liter ? `₹${data.cost_per_liter}` : '—'} />
        <InfoCard label="Odometer" value={fmtKm(data.odometer_reading)} icon={Gauge} />
      </div>

      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        <InfoCard label="Trip" value={tripDisplay} />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <InfoCard label="Station" value={data.fuel_station || '—'} icon={MapPin} />
      </div>

      {data.notes && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Notes</p>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">{data.notes}</p>
        </div>
      )}
    </div>
  );
};

const FuelModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  // Force browser reload comment: v2
  const isEdit = !!initial?.id && !isView;
  console.log('FuelModal Debug:', { initial, vehicleId, isEdit });

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (typeof initial?.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial?.vehicle_id ?? initial?.vehicle ?? '';
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      fuel_date: initial.fuel_date ?? '',
      fuel_type: initial.fuel_type ?? '',
      quantity_liters: initial.quantity_liters ?? '',
      cost_per_liter: initial.cost_per_liter ?? '',
      total_cost: initial.total_cost ?? '',
      odometer_reading: initial.odometer_reading ?? '',
      fuel_station: initial.fuel_station ?? '',
      notes: initial.notes ?? '',
      trip_id: initial.trip_id ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const { data: tripsData } = useTrips({
    vehicle: form.vehicle,
    limit: 100
  });
  const tripsList = tripsData?.results ?? tripsData ?? [];

  const create = useCreateFuelLog();
  const update = useUpdateFuelLog();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const next = { ...p, [f]: val };
      // Auto-calc total cost if quantity_liters and cost_per_liter changes
      if (f === 'quantity_liters' || f === 'cost_per_liter') {
        const q = f === 'quantity_liters' ? Number(val) : Number(p.quantity_liters);
        const c = f === 'cost_per_liter' ? Number(val) : Number(p.cost_per_liter);
        if (q && c) next.total_cost = (q * c).toFixed(2);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Fuel Log Details' : isEdit ? 'Edit Fuel Log' : 'Add Fuel Log'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {isView ? (
          <ViewDetail data={initial} onClose={onClose} />
        ) : (
          <>
            <FormSec title="Identification & Type" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect
                    value={form.vehicle}
                    placeholder={initial?.vehicle_registration_number || initial?.vehicle_registration || initial?.vehicle_display}
                    onChange={(id, v) => setForm(p => ({
                      ...p,
                      vehicle: id,
                      ...(v?.fuel_type ? { fuel_type: v.fuel_type.toUpperCase() } : {}),
                      ...(v?.current_odometer ? { odometer_reading: v.current_odometer } : {})
                    }))}
                  />
                </div>
              )}
              <Field label="Fuel Type" required>
                <Sel value={form.fuel_type} onChange={set('fuel_type')}>
                  <option value="">Select type</option>
                  {FUEL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Sel>
              </Field>
              <Field label="Fill Date" required>
                <Input type="date" value={form.fuel_date} onChange={set('fuel_date')} />
              </Field>
              <Field label="Trip ID">
                <Sel value={form.trip_id} onChange={set('trip_id')}>
                  <option value="">Select Trip (Optional)</option>
                  {tripsList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.trip_number || `TRIP-${t.id.slice(-6)}`} | {t.origin || 'N/A'} → {t.destination || 'N/A'} ({t.status})
                    </option>
                  ))}
                </Sel>
              </Field>
            </div>

            <FormSec title="Cost & Consumption" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity (Liters)" required>
                <Input type="number" step="0.01" placeholder="0.00" value={form.quantity_liters} onChange={set('quantity_liters')} />
              </Field>
              <Field label="Cost per Liter (₹)">
                <Input type="number" step="0.01" placeholder="0.00" value={form.cost_per_liter} onChange={set('cost_per_liter')} />
              </Field>
              <Field label="Total Cost (₹)" required>
                <Input type="number" step="0.01" placeholder="0.00" value={form.total_cost} onChange={set('total_cost')} />
              </Field>
              <Field label="Odometer (km)">
                <Input type="number" placeholder="Current reading" value={form.odometer_reading} onChange={set('odometer_reading')} />
              </Field>
            </div>

            <FormSec title="Location & Notes" />
            <Field label="Fuel Station">
              <Input placeholder="Station name or location" value={form.fuel_station} onChange={set('fuel_station')} />
            </Field>
            <Field label="Notes">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Any additional details..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

const VehicleFuel = ({ vehicleId, isTab }) => {
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState('LOGS'); // LOGS or ANALYTICS

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const { data, isLoading, isError, error, refetch } = useVehicleFuelLogs({
    ...(search && { search }),
    ...(typeFilter && { fuel_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
    page: currentPage,
  });
  const del = useDeleteFuelLog();

  const logs = data?.results ?? data ?? [];

  const stats = useMemo(() => {
    const totalSpend = logs.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
    const totalLiters = logs.reduce((s, l) => s + (Number(l.quantity_liters) || 0), 0);

    // Process analytics data
    const monthlyMap = {};
    const trendData = [...logs]
      .sort((a, b) => new Date(a.fuel_date) - new Date(b.fuel_date))
      .map(l => {
        const month = new Date(l.fuel_date).toLocaleString('default', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(l.total_cost);
        return {
          date: fmtDate(l.fuel_date),
          quantity: Number(l.quantity_liters),
          cost: Number(l.total_cost),
          odometer: l.odometer_reading ? Number(l.odometer_reading) : null
        };
      });

    const monthlyData = Object.keys(monthlyMap).map(month => ({
      name: month,
      spend: monthlyMap[month]
    })).slice(-6);

    const odoLogs = trendData.filter(l => l.odometer !== null);
    let avgEfficiency = 0;
    if (odoLogs.length > 1) {
      const distance = odoLogs[odoLogs.length - 1].odometer - odoLogs[0].odometer;
      const fuelConsumed = odoLogs.slice(0, -1).reduce((s, l) => s + l.quantity, 0);
      if (fuelConsumed > 0) avgEfficiency = distance / fuelConsumed;
    }

    return { totalSpend, totalLiters, monthlyData, trendData, avgEfficiency };
  }, [logs]);

  return (
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>
      {!isTab && (
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Fuel</h2>
            <p className="text-gray-500 text-sm tracking-tight">Track consumption and expenditures</p>
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search fuel logs, stations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                  title="Clear search"
                >
                  <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2 mr-2">
              <button
                title="Refresh Data"
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
              >
                <RotateCcw size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                <span>Refresh</span>
              </button>
              <button
                title="Export Logs"
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
              <button
                title="Import Logs"
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
              >
                <Upload size={14} />
                <span>Import</span>
              </button>
            </div>
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex gap-1 mr-2">
              <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'LOGS' ? 'bg-[#0052CC] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Logs</button>
              <button onClick={() => setActiveTab('ANALYTICS')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'ANALYTICS' ? 'bg-[#0052CC] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Analytics</button>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-1" />
          </div>
        </div>
      )}

      {activeTab === 'LOGS' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Stats Row */}
          {!isTab && (
            <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Spend:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{fmtINR(stats.totalSpend)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Liters:</span>
                <span className="text-[18px] font-black text-emerald-600">{stats.totalLiters.toFixed(1)} L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Avg Efficiency:</span>
                <span className="text-[18px] font-black text-indigo-600">
                  {stats.avgEfficiency > 0 ? `${stats.avgEfficiency.toFixed(2)} KM/L` : 'N/A'}
                </span>
              </div>
              <div className="ml-auto w-1/4 flex justify-end">
                <button
                  onClick={() => setModal({ mode: 'add' })}
                  className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>Add Fuel Log</span>
                </button>
              </div>
            </div>
          )}

          {/* Filters & Pagination Row */}
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
            <div className="flex items-center gap-6">
              <div className="relative w-64 text-gray-400">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10 text-[#172B4D] font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
                >
                  <option value="">All Fuel Types</option>
                  {FUEL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {typeFilter && (
                <button
                  onClick={() => { setTypeFilter(''); setCurrentPage(1); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear Filters"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
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

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <TabContentShimmer />
            ) : isError ? (
              <ErrorState message="Failed to load fuel logs" error={error?.message} onRetry={() => refetch()} />
            ) : !logs.length ? (
              <EmptyState icon={Fuel} text="No fuel logs found" onAdd={() => setModal({ mode: 'add' })} />
            ) : (
              <table className="w-full border-collapse text-left relative">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10 font-sans">
                  <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {!vehicleId && <th className="px-4 py-4">Vehicle</th>}
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4 text-center">Fuel Details</th>
                    <th className="px-4 py-4 text-center">Cost Info</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                      {!vehicleId && (
                        <td className="px-4 py-3 align-middle">
                          <span className="font-bold text-[#172B4D] text-[13px] uppercase font-mono">
                            {l.vehicle_registration_number ?? l.vehicle_display ?? l.vehicle ?? '—'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <Badge className={`${FUEL_COLORS[l.fuel_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'} uppercase py-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${l.fuel_type === 'DIESEL' ? 'bg-orange-500' : 'bg-sky-500'}`} />
                          {l.fuel_type_display ?? l.fuel_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        <p className="text-[13px] font-bold text-[#172B4D]">{l.quantity_liters} L</p>
                        <p className="text-[10px] font-mono font-bold text-gray-400">@{l.cost_per_liter}/L</p>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        <p className="text-[13px] font-black text-[#0052CC]">{fmtINR(l.total_cost)}</p>
                        {l.fuel_station && (
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-medium">
                            <MapPin size={10} /> {l.fuel_station}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap align-middle">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          <Calendar size={12} className="text-gray-400" />
                          {fmtDate(l.fuel_date)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right align-middle">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setViewing(l)}
                            className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => setModal({ mode: 'edit', data: l })}
                            className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all" title="Edit Log">
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Bottom Info Row */}
          {!isLoading && !isError && logs.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white shadow-sm z-20">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D] font-mono">{logs.length}</span> of <span className="font-bold text-[#172B4D] font-mono">{data?.count ?? logs.length}</span> fuel logs
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto py-6 space-y-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#0052CC] mb-4">
                <IndianRupee size={24} />
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Expenditure</p>
              <h3 className="text-2xl font-black text-[#172B4D]">{fmtINR(stats.totalSpend)}</h3>
              <p className="text-[11px] text-gray-500 mt-2 font-medium italic">Estimated across {logs.length} logs</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                <Fuel size={24} />
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Consumption</p>
              <h3 className="text-2xl font-black text-[#172B4D]">{stats.totalLiters.toFixed(1)} <span className="text-sm font-bold text-gray-400">Liters</span></h3>
              <p className="text-[11px] text-gray-500 mt-2 font-medium italic">Based on recorded fueling events</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                <Gauge size={24} />
              </div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Efficiency</p>
              <h3 className="text-2xl font-black text-[#172B4D]">
                {stats.avgEfficiency > 0 ? stats.avgEfficiency.toFixed(2) : 'N/A'} <span className="text-sm font-bold text-gray-400">KM/L</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-2 font-medium italic">Add odometer readings to track</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
              <h4 className="text-[14px] font-black text-[#172B4D] mb-6 flex items-center gap-2">
                Monthly Fuel Spend <span className="px-2 py-0.5 bg-blue-50 text-[#0052CC] text-[10px] rounded uppercase">Analytics</span>
              </h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Spend']}
                    />
                    <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                      {stats.monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === stats.monthlyData.length - 1 ? '#0052CC' : '#E2E8F0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
              <h4 className="text-[14px] font-black text-[#172B4D] mb-6 flex items-center gap-2">
                Liters Refilled <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded uppercase">Consumption</span>
              </h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trendData}>
                    <defs>
                      <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} unit="L" />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                    />
                    <Area type="monotone" dataKey="quantity" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <FuelModal
          initial={modal.data}
          onClose={() => setModal(null)}
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <FuelDetailView
          id={viewing.id}
          onClose={() => setViewing(null)}
          vehicleId={vehicleId}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label="Fuel Log"
          onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending}
        />
      )}
    </div>
  );
};

// ─── Detail View Component ───────────────────────────────────────────────────
const FuelDetailView = ({ id, onClose, vehicleId }) => {
  const { data, isLoading, isError, error } = useVehicleFuelLog(id);

  if (isLoading) return (
    <Modal title="Fuel Log Details" onClose={onClose} isView maxWidth="max-w-xl">
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
      </div>
    </Modal>
  );

  if (isError) return (
    <Modal title="Fuel Log Details" onClose={onClose} isView maxWidth="max-w-xl">
      <ErrorState message="Failed to load log details" error={error?.message} />
    </Modal>
  );

  return (
    <Modal title="Fuel Log Details" onClose={onClose} isView maxWidth="max-w-xl">
      <ViewDetail data={data} onClose={onClose} />
    </Modal>
  );
};

export default VehicleFuel;

