import React, { useState, useMemo } from 'react';
import {
  Fuel, Plus, Edit2, Trash2, X, Search, 
  RefreshCw, Loader2, AlertCircle, Calendar, 
  IndianRupee, Zap, Gauge, MapPin
} from 'lucide-react';
import {
  useVehicleFuelLogs,
  useCreateFuelLog,
  useUpdateFuelLog,
  useDeleteFuelLog,
} from '../../../queries/vehicles/vehicleInfoQuery';
import { 
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtINR, fmtKm
} from '../Common/VehicleCommon';

// ─── Constants ────────────────────────────────────────────────────────────────
const FUEL_TYPE_OPTIONS = [
  { value: 'DIESEL',   label: 'Diesel' },
  { value: 'PETROL',   label: 'Petrol' },
  { value: 'CNG',      label: 'CNG' },
  { value: 'LPG',      label: 'LPG' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID',   label: 'Hybrid' },
];

const FUEL_COLORS = {
  DIESEL:   'bg-gray-100 text-gray-700 border-gray-200',
  PETROL:   'bg-blue-50 text-blue-700 border-blue-200',
  CNG:      'bg-green-50 text-green-700 border-green-200',
  LPG:      'bg-orange-50 text-orange-700 border-orange-200',
  ELECTRIC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HYBRID:   'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const EMPTY_FORM = {
  vehicle: '', fuel_date: '', fuel_type: '',
  quantity: '', cost_per_litre: '', total_cost: '',
  odometer_reading: '', fuel_station: '', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FormSec = ({ title }) => (
  <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest pt-2 pb-1 border-b border-blue-50 mb-2">
    {title}
  </p>
);


// ─── Components ───────────────────────────────────────────────────────────────
const ViewDetail = ({ data, onClose }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Fuel Type" value={data.fuel_type_display ?? data.fuel_type} />
      <InfoCard label="Date" value={fmtDate(data.fuel_date)} icon={Calendar} />
      <InfoCard label="Quantity" value={data.quantity ? `${data.quantity} L` : '—'} icon={Fuel} />
      <InfoCard label="Total Cost" value={fmtINR(data.total_cost)} icon={IndianRupee} accent />
      <InfoCard label="Per Litre" value={data.cost_per_litre ? `₹${data.cost_per_litre}` : '—'} />
      <InfoCard label="Odometer" value={fmtKm(data.odometer_reading)} icon={Gauge} />
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

const FuelModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  const isEdit = !!initial?.id && !isView;

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (!initial?.vehicle) return '';
    if (typeof initial.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial.vehicle;
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle:            resolveVehicleId(),
      fuel_date:           initial.fuel_date           ?? '',
      fuel_type:           initial.fuel_type           ?? '',
      quantity:            initial.quantity            ?? '',
      cost_per_litre:      initial.cost_per_litre      ?? '',
      total_cost:          initial.total_cost          ?? '',
      odometer_reading:    initial.odometer_reading    ?? '',
      fuel_station:        initial.fuel_station        ?? '',
      notes:               initial.notes               ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateFuelLog();
  const update = useUpdateFuelLog();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const next = { ...p, [f]: val };
      // Auto-calc total cost if quantity and cost_per_litre changes
      if (f === 'quantity' || f === 'cost_per_litre') {
        const q = f === 'quantity' ? Number(val) : Number(p.quantity);
        const c = f === 'cost_per_litre' ? Number(val) : Number(p.cost_per_litre);
        if (q && c) next.total_cost = (q * c).toFixed(2);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else        create.mutate(clean, { onSuccess: onClose });
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
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
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
            </div>

            <FormSec title="Cost & Consumption" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity (Liters)" required>
                <Input type="number" step="0.01" placeholder="0.00" value={form.quantity} onChange={set('quantity')} />
              </Field>
              <Field label="Cost per Liter (₹)">
                <Input type="number" step="0.01" placeholder="0.00" value={form.cost_per_litre} onChange={set('cost_per_litre')} />
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
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useVehicleFuelLogs({
    ...(search && { search }),
    ...(typeFilter && { fuel_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
  });
  const del = useDeleteFuelLog();

  const logs = data?.results ?? data ?? [];

  const stats = useMemo(() => {
    const totalSpend = logs.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
    const totalLiters = logs.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
    return { totalSpend, totalLiters };
  }, [logs]);

  return (
    <div className={`flex flex-col h-full bg-[#F4F5F7] ${isTab ? '' : 'p-6'}`}>
      {!isTab && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Fuel Management</h1>
            <p className="text-sm text-gray-400 font-medium">Track consumption and fuel expenditures</p>
          </div>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
            <Plus size={16} /> Add Fuel Log
          </button>
        </div>
      )}

      {!isTab && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={IndianRupee} label="Total Spend" value={fmtINR(stats.totalSpend)} color="blue" accent />
          <StatCard icon={Fuel} label="Total Liters" value={`${stats.totalLiters.toFixed(1)} L`} color="emerald" />
          <StatCard icon={Zap} label="Avg Efficiency" value="N/A" color="indigo" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" placeholder="Search fuel logs..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Sel className="w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Fuel Types</option>
              {FUEL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Sel>
          </div>
          {isTab && (
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm">
              <Plus size={14} /> Add Fuel Log
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0052CC]" /></div>
          ) : !logs.length ? (
            <EmptyState icon={Fuel} text="No fuel logs found" onAdd={() => setModal({ mode: 'add' })} />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  {!vehicleId && <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>}
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Consumption</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Cost</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge className={FUEL_COLORS[l.fuel_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {l.fuel_type_display ?? l.fuel_type}
                      </Badge>
                    </td>
                    {!vehicleId && (
                      <td className="px-5 py-4 text-sm font-medium text-gray-600 truncate max-w-[150px]">
                        <span className="font-bold text-[#172B4D] font-mono text-[13px] uppercase">
                          {l.vehicle_registration_number ?? l.vehicle_registration ?? l.vehicle_display ?? l.vehicle ?? '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#172B4D]">{l.quantity} L</p>
                      <p className="text-[10px] font-mono font-medium text-gray-400">@{l.cost_per_litre}/L</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <Calendar size={12} className="text-gray-400" />
                        {fmtDate(l.fuel_date)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-black text-[#0052CC]">{fmtINR(l.total_cost)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewing(l)} className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-white rounded-lg transition-all shadow-sm"><Search size={14} /></button>
                        <button onClick={() => setModal({ mode: 'edit', data: l })} className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-white rounded-lg transition-all shadow-sm"><Edit2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <FuelModal 
          initial={modal.data} 
          onClose={() => setModal(null)} 
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <FuelModal 
          initial={viewing} 
          onClose={() => setViewing(null)} 
          isView 
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

export default VehicleFuel;
