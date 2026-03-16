import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Pause, Play,
  Truck, FileText, Shield, Wrench, ClipboardCheck,
  Fuel, CircleDot, Package, Tag, History,
  Gauge, Calendar, User, IndianRupee,
  ChevronRight, Loader2, AlertCircle,
  Hash, Palette, Zap, BarChart3
} from 'lucide-react';
import { useVehicle, useUpdateVehicle } from '../../queries/vehicles/vehicleQuery';

const FUEL_COLORS = {
  DIESEL:   'bg-orange-100 text-orange-700 border-orange-200',
  PETROL:   'bg-sky-100 text-sky-700 border-sky-200',
  CNG:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  LPG:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  ELECTRIC: 'bg-teal-100 text-teal-700 border-teal-200',
  HYBRID:   'bg-purple-100 text-purple-700 border-purple-200',
};

const STATUS_MAP = {
  ACTIVE:      { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  MAINTENANCE: { color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-300',  dot: 'bg-orange-500' },
  RETIRED:     { color: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-300',     dot: 'bg-red-500' },
  SOLD:        { color: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-300',    dot: 'bg-gray-400' },
  SCRAPPED:    { color: 'text-gray-600',    bg: 'bg-gray-100',    border: 'border-gray-300',    dot: 'bg-gray-500' },
};

const INSP_STATUS = {
  PASS:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FAIL:    'bg-red-50 text-red-700 border border-red-200',
  PARTIAL: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: BarChart3 },
  { id: 'documents',   label: 'Documents',   icon: FileText,       key: 'documents' },
  { id: 'insurance',   label: 'Insurance',   icon: Shield,         key: 'insurance_policies' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench,         key: 'maintenance_schedules' },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, key: 'inspections' },
  { id: 'fuel',        label: 'Fuel Logs',   icon: Fuel,           key: 'fuel_logs' },
  { id: 'tires',       label: 'Tires',       icon: CircleDot,      key: 'tires' },
  { id: 'accessories', label: 'Accessories', icon: Package,        key: 'accessories' },
  { id: 'tolltags',    label: 'Toll Tags',   icon: Tag,            key: 'toll_tags' },
  { id: 'ownership',   label: 'Ownership',   icon: History,        key: 'ownership_history' },
];

const driverName = (d) => {
  if (!d) return null;
  if (typeof d === 'object') return d?.name ?? d?.user_id ?? 'Driver Assigned';
  return d;
};
const fmtINR = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : null;
const fmtKm  = (n) => n != null ? `${Number(n).toLocaleString('en-IN')} km` : null;

const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${className}`}>
    {children}
  </span>
);

const InfoCard = ({ label, value, icon: Icon, accent }) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-1.5 transition-all hover:shadow-sm
    ${accent ? 'bg-[#0052CC]/5 border-[#0052CC]/20' : 'bg-white border-gray-100 hover:border-[#0052CC]/20'}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      {Icon && <Icon size={13} className={accent ? 'text-[#0052CC]/40' : 'text-gray-200'} />}
    </div>
    <span className={`text-sm font-bold truncate ${accent ? 'text-[#0052CC]' : 'text-[#172B4D]'}`}>
      {value ?? <span className="text-gray-300 font-normal">—</span>}
    </span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, count }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
      <Icon size={14} className="text-gray-500" />
    </div>
    <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wide">{title}</h3>
    {count != null && (
      <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{count}</span>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
      <Icon size={24} className="text-gray-300" />
    </div>
    <p className="text-sm font-semibold text-gray-400">{text}</p>
  </div>
);

const VehicleHeader = ({ v, onEdit, onToggle, updating }) => {
  const st   = STATUS_MAP[v.status] ?? STATUS_MAP.RETIRED;
  const fuel = FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#0052CC] via-[#0066FF] to-[#172B4D]" />
      <div className="p-6 flex flex-col md:flex-row gap-6">
        <div className="shrink-0">
          <div className="w-52 h-36 rounded-2xl bg-gradient-to-br from-[#0052CC] via-[#0043A8] to-[#172B4D]
            flex flex-col items-center justify-center gap-1.5 shadow-xl shadow-blue-200/60 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <span className="text-[9px] font-black text-blue-300 tracking-[0.25em] uppercase z-10">
              {v.vehicle_type?.category ?? 'Fleet Vehicle'}
            </span>
            <span className="text-3xl font-black text-white tracking-widest font-mono z-10 drop-shadow">
              {v.registration_number}
            </span>
            <div className="flex items-center gap-2 z-10">
              {v.capacity_tonnage && <span className="text-[10px] text-blue-300 font-bold">{v.capacity_tonnage}T</span>}
              {v.vehicle_type?.type_name && <span className="text-[10px] text-blue-400 font-semibold">· {v.vehicle_type.type_name}</span>}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#172B4D] leading-tight">
                  {v.make} <span className="text-[#0052CC]">{v.model}</span>
                </h1>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">
                  {v.year && `Year ${v.year}`}
                  {v.vehicle_identification_number && ` · VIN: ${v.vehicle_identification_number}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={onEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
                  <Edit2 size={14} /> Edit
                </button>
                {v.status === 'ACTIVE' && (
                  <button onClick={onToggle} disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50">
                    <Pause size={14} /> Suspend
                  </button>
                )}
                {v.status === 'MAINTENANCE' && (
                  <button onClick={onToggle} disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50">
                    <Play size={14} /> Activate
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge className={`${st.bg} ${st.color} ${st.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {v.status_display ?? v.status}
              </Badge>
              {v.ownership_type && <Badge className="bg-blue-50 text-blue-600 border-blue-200">{v.ownership_type_display ?? v.ownership_type}</Badge>}
              {v.fuel_type && <Badge className={`border ${fuel}`}><Fuel size={10} /> {v.fuel_type_display ?? v.fuel_type}</Badge>}
              {v.transmission_type && <Badge className="bg-gray-100 text-gray-600 border-gray-200"><Zap size={10} /> {v.transmission_type_display ?? v.transmission_type}</Badge>}
              {v.color && <Badge className="bg-gray-100 text-gray-600 border-gray-200"><Palette size={10} /> {v.color}</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Odometer', value: fmtKm(v.current_odometer), icon: Gauge },
              { label: 'Tonnage',  value: v.capacity_tonnage ? `${v.capacity_tonnage} T` : null, icon: Truck },
              { label: 'Driver',   value: driverName(v.assigned_driver), icon: User },
              { label: 'Purchase', value: fmtINR(v.purchase_price), icon: IndianRupee },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-[#0052CC]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                  <p className="text-xs font-bold text-[#172B4D] truncate">{value ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ v }) => {
  const st = STATUS_MAP[v.status] ?? STATUS_MAP.RETIRED;
  const activeInsurance = v.insurance_policies?.find(p => p.status === 'ACTIVE') ?? null;
  const nextMaint       = v.maintenance_schedules?.find(m => m.status === 'SCHEDULED') ?? null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Status',       value: v.status_display ?? v.status, color: st.color },
          { label: 'Odometer',     value: fmtKm(v.current_odometer) ?? '—', color: 'text-[#172B4D]' },
          { label: 'Insurance',    value: activeInsurance ? 'Active' : (v.insurance_policies?.length ? 'Expired' : 'None'),
            color: activeInsurance ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Next Service', value: nextMaint?.scheduled_date ?? 'Not scheduled', color: 'text-[#172B4D]' },
        ].map(s => (
          <div key={s.label} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
          <SectionHeader icon={Truck} title="Vehicle Details" />
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard label="Registration" value={v.registration_number} icon={Hash} accent />
            <InfoCard label="Make"         value={v.make}    icon={Truck} />
            <InfoCard label="Model"        value={v.model} />
            <InfoCard label="Year"         value={v.year}    icon={Calendar} />
            <InfoCard label="Type"         value={v.vehicle_type?.type_name} icon={Truck} />
            <InfoCard label="Fuel"         value={v.fuel_type_display ?? v.fuel_type} icon={Fuel} />
            <InfoCard label="Transmission" value={v.transmission_type_display ?? v.transmission_type} icon={Zap} />
            <InfoCard label="Color"        value={v.color}   icon={Palette} />
            <InfoCard label="VIN"          value={v.vehicle_identification_number} icon={Hash} />
            <InfoCard label="Odometer"     value={fmtKm(v.current_odometer)} icon={Gauge} />
            <InfoCard label="Status"       value={v.status_display ?? v.status} />
            <InfoCard label="Ownership"    value={v.ownership_type_display ?? v.ownership_type} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <SectionHeader icon={IndianRupee} title="Purchase Details" />
            <div className="grid grid-cols-2 gap-2.5">
              <InfoCard label="Purchase Date"  value={v.purchase_date} icon={Calendar} />
              <InfoCard label="Purchase Price" value={fmtINR(v.purchase_price)} icon={IndianRupee} accent />
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <SectionHeader icon={Gauge} title="Capacity" />
            <div className="grid grid-cols-2 gap-2.5">
              <InfoCard label="Tonnage" value={v.capacity_tonnage ? `${v.capacity_tonnage} T` : null} />
              <InfoCard label="Volume"  value={v.capacity_volume  ? `${v.capacity_volume} m³` : null} />
            </div>
          </div>
          {activeInsurance && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
              <SectionHeader icon={Shield} title="Active Insurance" />
              <p className="font-black text-[#172B4D] text-base font-mono">{activeInsurance.policy_number}</p>
              <p className="text-sm text-gray-500 mt-0.5">{activeInsurance.insurance_company} · {activeInsurance.policy_type_display}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100">
                <span className="text-xs text-gray-400">Expires</span>
                <span className="text-xs font-bold text-emerald-600">{activeInsurance.expiry_date}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DocumentsTab = ({ v }) => {
  const docs = v.documents ?? [];
  if (!docs.length) return <EmptyState icon={FileText} text="No documents found" />;
  return (
    <div className="space-y-3">
      {docs.map(d => (
        <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-[#0052CC]/30 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-[#0052CC]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#172B4D] truncate">{d.document_type_display ?? d.document_type}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {d.document_number && `#${d.document_number}`}{d.expiry_date && ` · Expires ${d.expiry_date}`}
            </p>
          </div>
          {d.status && (
            <Badge className={d.status === 'VALID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}>
              {d.status_display ?? d.status}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};

const InsuranceTab = ({ v }) => {
  const policies = v.insurance_policies ?? [];
  if (!policies.length) return <EmptyState icon={Shield} text="No insurance policies found" />;
  return (
    <div className="space-y-4">
      {policies.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-50">
            <div>
              <p className="font-black text-[#172B4D] text-lg font-mono">{p.policy_number}</p>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">{p.insurance_company}</p>
            </div>
            <Badge className={p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {p.status_display ?? p.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCard label="Policy Type" value={p.policy_type_display} />
            <InfoCard label="Premium"     value={fmtINR(p.premium_amount)}  icon={IndianRupee} />
            <InfoCard label="Coverage"    value={fmtINR(p.coverage_amount)} icon={IndianRupee} accent />
            <InfoCard label="Issue Date"  value={p.issue_date}  icon={Calendar} />
            <InfoCard label="Expiry Date" value={p.expiry_date} icon={Calendar} />
            {p.notes && <InfoCard label="Notes" value={p.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
};

const MaintenanceTab = ({ v }) => {
  const schedules = v.maintenance_schedules ?? [];
  const records   = v.maintenance_records   ?? [];
  const SCHED_COLORS = {
    SCHEDULED: 'bg-blue-50 text-blue-600 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    OVERDUE:   'bg-red-50 text-red-600 border-red-200',
    CANCELLED: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <div className="space-y-8">
      <div>
        <SectionHeader icon={Wrench} title="Schedules" count={schedules.length} />
        {!schedules.length ? <EmptyState icon={Wrench} text="No maintenance schedules" /> : (
          <div className="space-y-3">
            {schedules.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#172B4D]">{m.maintenance_type_display ?? m.maintenance_type}</p>
                    {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                  </div>
                  <Badge className={SCHED_COLORS[m.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}>{m.status_display ?? m.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InfoCard label="Scheduled" value={m.scheduled_date} icon={Calendar} />
                  <InfoCard label="Next Due"  value={m.next_due_date}  icon={Calendar} />
                  <InfoCard label="Interval"  value={m.service_interval_km ? `${m.service_interval_km} km` : null} icon={Gauge} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <SectionHeader icon={ClipboardCheck} title="Service Records" count={records.length} />
        {!records.length ? <EmptyState icon={ClipboardCheck} text="No service records" /> : (
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#172B4D]">{r.service_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.service_provider}</p>
                  </div>
                  {r.total_cost && (
                    <span className="font-black text-emerald-600 text-sm flex items-center gap-0.5">
                      <IndianRupee size={13} />{Number(r.total_cost).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InfoCard label="Service Date" value={r.service_date} icon={Calendar} />
                  <InfoCard label="Labor Hours"  value={r.labor_hours ? `${r.labor_hours} hrs` : null} />
                  <InfoCard label="Next Service" value={r.next_service_due} icon={Calendar} />
                </div>
                {r.parts_replaced?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Parts Replaced</p>
                    <div className="flex flex-wrap gap-2">
                      {r.parts_replaced.map((p, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600">
                          {p.part_name} × {p.quantity}{p.cost && <span className="text-gray-400 ml-1.5">₹{p.cost.toLocaleString('en-IN')}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const InspectionsTab = ({ v }) => {
  const items = v.inspections ?? [];
  if (!items.length) return <EmptyState icon={ClipboardCheck} text="No inspections found" />;
  return (
    <div className="space-y-3">
      {items.map(i => (
        <div key={i.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-[#172B4D]">{i.inspection_type_display ?? i.inspection_type}</p>
              {i.inspector_signature && <p className="text-xs text-gray-400 mt-0.5">Inspector: {i.inspector_signature}</p>}
            </div>
            <Badge className={INSP_STATUS[i.overall_status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}>{i.overall_status}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Date"     value={i.inspection_date ? new Date(i.inspection_date).toLocaleDateString('en-IN') : null} icon={Calendar} />
            <InfoCard label="Odometer" value={fmtKm(i.odometer_reading)} icon={Gauge} />
            <InfoCard label="Resolved" value={i.resolved_date ?? (i.overall_status === 'PASS' ? 'N/A' : 'Pending')} />
          </div>
          {i.defects_found?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Defects Found</p>
              <div className="flex flex-wrap gap-2">
                {i.defects_found.map((d, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-xs font-semibold text-red-600">{d}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const FuelLogsTab = ({ v }) => {
  const logs = v.fuel_logs ?? [];
  if (!logs.length) return <EmptyState icon={Fuel} text="No fuel logs found" />;
  const totalCost = logs.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#0052CC] to-[#0043A8] p-5 flex items-center justify-between shadow-lg shadow-blue-200">
        <div>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Total Fuel Spend</p>
          <p className="text-white text-2xl font-black mt-0.5 flex items-center gap-1"><IndianRupee size={18} />{totalCost.toLocaleString('en-IN')}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Fuel size={22} className="text-white" /></div>
      </div>
      <div className="space-y-3">
        {logs.map(l => (
          <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 hover:border-[#0052CC]/20 transition-all">
            <InfoCard label="Date"       value={l.fuel_date}  icon={Calendar} />
            <InfoCard label="Quantity"   value={l.quantity ? `${l.quantity} L` : null} icon={Fuel} />
            <InfoCard label="Per Litre"  value={l.cost_per_litre ? `₹${l.cost_per_litre}` : null} icon={IndianRupee} />
            <InfoCard label="Total Cost" value={fmtINR(l.total_cost)} icon={IndianRupee} accent />
          </div>
        ))}
      </div>
    </div>
  );
};

const TiresTab = ({ v }) => {
  const tires = v.tires ?? [];
  if (!tires.length) return <EmptyState icon={CircleDot} text="No tires found" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tires.map(t => (
        <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
            <div>
              <p className="font-black text-[#172B4D]">{t.tire_brand}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{t.tire_position_display ?? t.tire_position}</p>
            </div>
            <Badge className={t.status === 'INSTALLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
              {t.status_display ?? t.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Serial No."  value={t.tire_serial_number} icon={Hash} />
            <InfoCard label="Tread Depth" value={t.tread_depth ? `${t.tread_depth} mm` : null} />
            <InfoCard label="Installed"   value={t.installation_date} icon={Calendar} />
            <InfoCard label="Install Odo" value={fmtKm(t.installation_odometer)} icon={Gauge} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AccessoriesTab = ({ v }) => {
  const items = v.accessories ?? [];
  if (!items.length) return <EmptyState icon={Package} text="No accessories found" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(a => (
        <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
            <div>
              <p className="font-black text-[#172B4D]">{a.accessory_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.accessory_type_display ?? a.accessory_type}</p>
            </div>
            <Badge className={a.status === 'INSTALLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
              {a.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Serial No." value={a.serial_number}     icon={Hash} />
            <InfoCard label="Installed"  value={a.installation_date} icon={Calendar} />
            <InfoCard label="Warranty"   value={a.warranty_expiry}   icon={Calendar} />
            {a.notes && <InfoCard label="Notes" value={a.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
};

const TollTagsTab = ({ v }) => {
  const tags = v.toll_tags ?? [];
  if (!tags.length) return <EmptyState icon={Tag} text="No toll tags found" />;
  return (
    <div className="space-y-4">
      {tags.map(t => (
        <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
            <div>
              <p className="font-black text-[#172B4D] font-mono text-lg">{t.tag_number}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{t.tag_provider}</p>
            </div>
            <Badge className={t.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}>
              <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {t.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCard label="Balance"  value={fmtINR(t.recharge_balance)} icon={IndianRupee} accent />
            <InfoCard label="Issued"   value={t.issue_date}  icon={Calendar} />
            <InfoCard label="Expiry"   value={t.expiry_date} icon={Calendar} />
            <InfoCard label="Bank A/C" value={t.linked_bank_account} icon={Hash} />
            {t.notes && <InfoCard label="Notes" value={t.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
};

const OwnershipTab = ({ v }) => {
  const history = v.ownership_history ?? [];
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-[#0052CC]/5 to-white border border-[#0052CC]/15 rounded-2xl p-5">
        <SectionHeader icon={User} title="Current Ownership" />
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Type"            value={v.ownership_type_display ?? v.ownership_type} />
          <InfoCard label="Purchase Date"   value={v.purchase_date} icon={Calendar} />
          <InfoCard label="Purchase Price"  value={fmtINR(v.purchase_price)} icon={IndianRupee} accent />
          <InfoCard label="Assigned Driver" value={driverName(v.assigned_driver) ?? 'Unassigned'} icon={User} />
        </div>
      </div>
      <div>
        <SectionHeader icon={History} title="History" count={history.length} />
        {!history.length
          ? <EmptyState icon={History} text="No ownership history available" />
          : <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-3 gap-3">
                  <InfoCard label="Owner" value={h.owner_name}         icon={User} />
                  <InfoCard label="From"  value={h.start_date}         icon={Calendar} />
                  <InfoCard label="To"    value={h.end_date ?? 'Present'} icon={Calendar} />
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
};

const TabContent = ({ tab, v }) => {
  const map = {
    overview: OverviewTab, documents: DocumentsTab, insurance: InsuranceTab,
    maintenance: MaintenanceTab, inspections: InspectionsTab, fuel: FuelLogsTab,
    tires: TiresTab, accessories: AccessoriesTab, tolltags: TollTagsTab, ownership: OwnershipTab,
  };
  const C = map[tab];
  return C ? <C v={v} /> : null;
};

const VehicleDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: v, isLoading, isError, error, refetch } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();

  const handleToggle = () => {
    if (!v) return;
    updateVehicle.mutate({ id: v.id, data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } });
  };

  const handleEdit = () => navigate(`/tenant/dashboard/vehicles/${id}/edit`);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
        <span className="text-sm font-medium">Loading vehicle details...</span>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-red-400">
        <AlertCircle size={36} />
        <p className="text-sm font-semibold">Failed to load vehicle</p>
        <p className="text-xs text-gray-400">{error?.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl mt-1">Retry</button>
      </div>
    </div>
  );

  if (!v) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <Loader2 size={32} className="animate-spin text-[#0052CC]" />
    </div>
  );

  const countFor = (key) => {
    if (!key) return null;
    const val = v[key];
    return Array.isArray(val) ? val.length : null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/tenant/dashboard/vehicles')}
            className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
            <ArrowLeft size={14} /> Vehicles
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{v.registration_number}</span>
        </div>

        <VehicleHeader v={v} onEdit={handleEdit} onToggle={handleToggle} updating={updateVehicle.isPending} />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            {TABS.map(tab => {
              const count    = countFor(tab.key);
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-[12px] font-bold whitespace-nowrap border-b-2 transition-all shrink-0
                    ${isActive
                      ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/60'
                      : 'border-transparent text-gray-400 hover:text-[#172B4D] hover:bg-gray-50'}`}>
                  <tab.icon size={14} />
                  {tab.label}
                  {count != null && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none
                      ${isActive ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-6 bg-gray-50/30">
            <TabContent tab={activeTab} v={v} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleDetail;
