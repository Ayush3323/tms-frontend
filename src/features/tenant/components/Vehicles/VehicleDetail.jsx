import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Pause, Play, RefreshCw,
  Truck, FileText, Shield, Wrench, ClipboardCheck,
  Fuel, CircleDot, Package, Tag, History,
  MapPin, Gauge, Calendar, User, AlertTriangle,
  CheckCircle, Clock, XCircle, IndianRupee,
  ChevronRight, Download, MoreHorizontal, Loader2,
  AlertCircle, Hash, Palette, Zap, BarChart3
} from 'lucide-react';
import { useVehicle, useUpdateVehicle } from '../../queries/vehicles/vehicleQuery';

// ─── Style constants ──────────────────────────────────────────────────
const FUEL_COLORS = {
  DIESEL:   'bg-orange-50 text-orange-600 border-orange-200',
  PETROL:   'bg-sky-50 text-sky-600 border-sky-200',
  CNG:      'bg-emerald-50 text-emerald-600 border-emerald-200',
  LPG:      'bg-yellow-50 text-yellow-700 border-yellow-200',
  ELECTRIC: 'bg-teal-50 text-teal-600 border-teal-200',
  HYBRID:   'bg-purple-50 text-purple-600 border-purple-200',
};

const STATUS_MAP = {
  ACTIVE:      { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  MAINTENANCE: { color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500',  label: 'Maintenance' },
  RETIRED:     { color: 'text-red-500',      bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-400',     label: 'Retired' },
  SOLD:        { color: 'text-gray-500',     bg: 'bg-gray-50',    border: 'border-gray-200',    dot: 'bg-gray-400',    label: 'Sold' },
  SCRAPPED:    { color: 'text-gray-500',     bg: 'bg-gray-100',   border: 'border-gray-200',    dot: 'bg-gray-500',    label: 'Scrapped' },
};

const INSP_STATUS = {
  PASS: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FAIL: 'bg-red-50 text-red-700 border border-red-200',
  PARTIAL: 'bg-orange-50 text-orange-700 border border-orange-200',
};

// ─── Tabs config ──────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview',    icon: BarChart3 },
  { id: 'documents',    label: 'Documents',   icon: FileText,      key: 'documents' },
  { id: 'insurance',    label: 'Insurance',   icon: Shield,        key: 'insurance_policies' },
  { id: 'maintenance',  label: 'Maintenance', icon: Wrench,        key: 'maintenance_schedules' },
  { id: 'inspections',  label: 'Inspections', icon: ClipboardCheck,key: 'inspections' },
  { id: 'fuel',         label: 'Fuel Logs',   icon: Fuel,          key: 'fuel_logs' },
  { id: 'tires',        label: 'Tires',       icon: CircleDot,     key: 'tires' },
  { id: 'accessories',  label: 'Accessories', icon: Package,       key: 'accessories' },
  { id: 'tolltags',     label: 'Toll Tags',   icon: Tag,           key: 'toll_tags' },
  { id: 'ownership',    label: 'Ownership',   icon: History,       key: 'ownership_history' },
];

// ─── Reusable components ──────────────────────────────────────────────
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${className}`}>
    {children}
  </span>
);

const InfoCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      {Icon && <Icon size={14} className="text-gray-300" />}
    </div>
    <span className="text-sm font-bold text-[#172B4D] truncate">{value ?? '—'}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{children}</h3>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-300">
    <Icon size={36} className="mb-3 opacity-50" />
    <p className="text-sm font-medium text-gray-400">{text}</p>
  </div>
);

// ─── Vehicle Header Card ──────────────────────────────────────────────
const VehicleHeader = ({ v, onEdit, onToggle, updating }) => {
  const st = STATUS_MAP[v.status] ?? STATUS_MAP.RETIRED;
  const fuel = FUEL_COLORS[v.fuel_type] ?? 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row gap-6">
      {/* Plate card */}
      <div className="shrink-0">
        <div className="w-48 h-32 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#172B4D] flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-200">
          <span className="text-[10px] font-bold text-blue-200 tracking-[0.2em] uppercase">
            {v.vehicle_type?.category ?? 'Vehicle'}
          </span>
          <span className="text-2xl font-black text-white tracking-widest font-mono">
            {v.registration_number}
          </span>
          <span className="text-[11px] text-blue-300 font-semibold">
            {v.capacity_tonnage ? `${v.capacity_tonnage}T` : ''}{v.vehicle_type?.type_name ? ` · ${v.vehicle_type.type_name}` : ''}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">
            {v.make} {v.model}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {v.year && <span className="text-sm text-gray-400 font-medium">Year {v.year}</span>}
            {v.vehicle_type?.type_name && <span className="text-sm text-gray-400">· {v.vehicle_type.type_name}</span>}
            <Badge className={`${st.bg} ${st.color} ${st.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5`} />
              {v.status_display ?? v.status}
            </Badge>
            {v.ownership_type && (
              <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                {v.ownership_type_display ?? v.ownership_type}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {v.fuel_type && (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[12px] border ${fuel}`}>
              <Fuel size={12} /> {v.fuel_type_display ?? v.fuel_type}
            </span>
          )}
          {v.current_odometer != null && (
            <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
              <Gauge size={14} className="text-gray-400" />
              {Number(v.current_odometer).toLocaleString('en-IN')} km
            </span>
          )}
          {v.year && (
            <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
              <Calendar size={14} className="text-gray-400" /> {v.year}
            </span>
          )}
          {v.assigned_driver && (
            <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
              <User size={14} className="text-gray-400" /> {v.assigned_driver}
            </span>
          )}
          {v.ownership_type && (
            <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
              <Hash size={14} className="text-gray-400" /> {v.ownership_type_display ?? v.ownership_type}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        <button onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm">
          <Edit2 size={14} /> Edit Vehicle
        </button>
        {v.status === 'ACTIVE' && (
          <button onClick={onToggle} disabled={updating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50">
            <Pause size={14} /> Suspend
          </button>
        )}
        {v.status === 'MAINTENANCE' && (
          <button onClick={onToggle} disabled={updating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50">
            <Play size={14} /> Activate
          </button>
        )}
      </div>
    </div>
  );
};

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────
const OverviewTab = ({ v }) => {
  const st = STATUS_MAP[v.status] ?? STATUS_MAP.RETIRED;
  const activeInsurance = v.insurance_policies?.find(p => p.status === 'ACTIVE') ?? null;
  const nextMaint = v.maintenance_schedules?.find(m => m.status === 'SCHEDULED') ?? null;

  return (
    <div className="space-y-6">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</p>
          <span className={`text-lg font-black ${st.color}`}>{v.status_display ?? v.status}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Odometer</p>
          <span className="text-lg font-black text-[#172B4D]">
            {v.current_odometer != null ? `${Number(v.current_odometer).toLocaleString('en-IN')} km` : '—'}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Insurance</p>
          <span className={`text-lg font-black ${activeInsurance ? 'text-emerald-600' : 'text-red-500'}`}>
            {activeInsurance ? 'Active' : v.insurance_policies?.length ? 'Expired' : 'None'}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Next Service</p>
          <span className="text-lg font-black text-[#172B4D]">
            {nextMaint?.scheduled_date ?? '—'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <SectionTitle>Vehicle Details</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Registration No." value={v.registration_number} icon={Hash} />
            <InfoCard label="Make" value={v.make} icon={Truck} />
            <InfoCard label="Model" value={v.model} />
            <InfoCard label="Year" value={v.year} icon={Calendar} />
            <InfoCard label="Type" value={v.vehicle_type?.type_name} icon={Truck} />
            <InfoCard label="Fuel Type" value={v.fuel_type_display ?? v.fuel_type} icon={Fuel} />
            <InfoCard label="Transmission" value={v.transmission_type_display ?? v.transmission_type} icon={Zap} />
            <InfoCard label="Color" value={v.color} icon={Palette} />
            <InfoCard label="Odometer" value={v.current_odometer ? `${Number(v.current_odometer).toLocaleString('en-IN')} km` : null} icon={Gauge} />
            <InfoCard label="VIN / Chassis" value={v.vehicle_identification_number} icon={Hash} />
            <InfoCard label="Status" value={v.status_display ?? v.status} />
            <InfoCard label="Ownership" value={v.ownership_type_display ?? v.ownership_type} />
          </div>
        </div>

        {/* Purchase & Capacity */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionTitle>Purchase Details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Purchase Date" value={v.purchase_date} icon={Calendar} />
              <InfoCard label="Purchase Price"
                value={v.purchase_price ? `₹${Number(v.purchase_price).toLocaleString('en-IN')}` : null}
                icon={IndianRupee} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionTitle>Capacity</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Tonnage" value={v.capacity_tonnage ? `${v.capacity_tonnage} T` : null} />
              <InfoCard label="Volume" value={v.capacity_volume ? `${v.capacity_volume} m³` : null} />
            </div>
          </div>

          {/* Active insurance snippet */}
          {activeInsurance && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <SectionTitle>Active Insurance</SectionTitle>
              <div className="space-y-1">
                <p className="font-bold text-[#172B4D]">{activeInsurance.policy_number}</p>
                <p className="text-sm text-gray-500">{activeInsurance.insurance_company} · {activeInsurance.policy_type_display}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-2">Expires {activeInsurance.expiry_date}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DOCUMENTS TAB ────────────────────────────────────────────────────
const DocumentsTab = ({ v }) => {
  const docs = v.documents ?? [];
  if (!docs.length) return <EmptyState icon={FileText} text="No documents found" />;
  return (
    <div className="space-y-3">
      {docs.map(d => (
        <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-[#0052CC]/30 hover:shadow-sm transition-all">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-[#0052CC]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#172B4D] truncate">{d.document_type_display ?? d.document_type}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {d.document_number && `#${d.document_number}`}
              {d.expiry_date && ` · Expires ${d.expiry_date}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {d.status && (
              <Badge className={d.status === 'VALID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}>
                {d.status_display ?? d.status}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── INSURANCE TAB ────────────────────────────────────────────────────
const InsuranceTab = ({ v }) => {
  const policies = v.insurance_policies ?? [];
  if (!policies.length) return <EmptyState icon={Shield} text="No insurance policies found" />;
  return (
    <div className="space-y-4">
      {policies.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-black text-[#172B4D] text-lg font-mono">{p.policy_number}</p>
              <p className="text-sm text-gray-400 mt-0.5">{p.insurance_company}</p>
            </div>
            <Badge className={p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {p.status_display ?? p.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCard label="Policy Type" value={p.policy_type_display} />
            <InfoCard label="Premium" value={p.premium_amount ? `₹${Number(p.premium_amount).toLocaleString('en-IN')}` : null} icon={IndianRupee} />
            <InfoCard label="Coverage" value={p.coverage_amount ? `₹${Number(p.coverage_amount).toLocaleString('en-IN')}` : null} icon={IndianRupee} />
            <InfoCard label="Issue Date" value={p.issue_date} icon={Calendar} />
            <InfoCard label="Expiry Date" value={p.expiry_date} icon={Calendar} />
            {p.notes && <InfoCard label="Notes" value={p.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── MAINTENANCE TAB ──────────────────────────────────────────────────
const MaintenanceTab = ({ v }) => {
  const schedules = v.maintenance_schedules ?? [];
  const records   = v.maintenance_records   ?? [];

  const SCHED_STATUS = {
    SCHEDULED:  'bg-blue-50 text-blue-600 border-blue-200',
    COMPLETED:  'bg-emerald-50 text-emerald-600 border-emerald-200',
    OVERDUE:    'bg-red-50 text-red-600 border-red-200',
    CANCELLED:  'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <div className="space-y-6">
      {/* Schedules */}
      <div>
        <SectionTitle>Schedules ({schedules.length})</SectionTitle>
        {!schedules.length
          ? <EmptyState icon={Wrench} text="No maintenance schedules" />
          : <div className="space-y-3">
              {schedules.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0052CC]/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[#172B4D]">{m.maintenance_type_display ?? m.maintenance_type}</p>
                      {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                    </div>
                    <Badge className={SCHED_STATUS[m.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}>
                      {m.status_display ?? m.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Scheduled" value={m.scheduled_date} icon={Calendar} />
                    <InfoCard label="Next Due" value={m.next_due_date} icon={Calendar} />
                    <InfoCard label="Interval" value={m.service_interval_km ? `${m.service_interval_km} km` : null} icon={Gauge} />
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Records */}
      <div>
        <SectionTitle>Service Records ({records.length})</SectionTitle>
        {!records.length
          ? <EmptyState icon={ClipboardCheck} text="No service records" />
          : <div className="space-y-3">
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
                    <InfoCard label="Labor Hours" value={r.labor_hours ? `${r.labor_hours} hrs` : null} />
                    <InfoCard label="Next Service" value={r.next_service_due} icon={Calendar} />
                  </div>
                  {r.parts_replaced?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Parts Replaced</p>
                      <div className="flex flex-wrap gap-2">
                        {r.parts_replaced.map((p, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600">
                            {p.part_name} × {p.quantity}
                            {p.cost && <span className="text-gray-400 ml-1">₹{p.cost.toLocaleString('en-IN')}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
};

// ─── INSPECTIONS TAB ──────────────────────────────────────────────────
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
            <Badge className={INSP_STATUS[i.overall_status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}>
              {i.overall_status}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Date" value={i.inspection_date ? new Date(i.inspection_date).toLocaleDateString('en-IN') : null} icon={Calendar} />
            <InfoCard label="Odometer" value={i.odometer_reading ? `${Number(i.odometer_reading).toLocaleString()} km` : null} icon={Gauge} />
            <InfoCard label="Resolved" value={i.resolved_date ?? (i.overall_status === 'PASS' ? 'N/A' : 'Pending')} />
          </div>
          {i.defects_found?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Defects Found</p>
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

// ─── FUEL LOGS TAB ────────────────────────────────────────────────────
const FuelLogsTab = ({ v }) => {
  const logs = v.fuel_logs ?? [];
  if (!logs.length) return <EmptyState icon={Fuel} text="No fuel logs found" />;
  const totalCost = logs.reduce((s, l) => s + (Number(l.total_cost) || 0), 0);
  return (
    <div className="space-y-4">
      <div className="bg-[#0052CC] rounded-xl p-4 flex items-center justify-between">
        <span className="text-white text-sm font-semibold">Total Fuel Spend</span>
        <span className="text-white text-xl font-black flex items-center gap-1">
          <IndianRupee size={16} />{totalCost.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="space-y-3">
        {logs.map(l => (
          <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 hover:border-[#0052CC]/20 transition-all">
            <InfoCard label="Date" value={l.fuel_date} icon={Calendar} />
            <InfoCard label="Quantity" value={l.quantity ? `${l.quantity} L` : null} icon={Fuel} />
            <InfoCard label="Cost/Litre" value={l.cost_per_litre ? `₹${l.cost_per_litre}` : null} icon={IndianRupee} />
            <InfoCard label="Total Cost" value={l.total_cost ? `₹${Number(l.total_cost).toLocaleString('en-IN')}` : null} icon={IndianRupee} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── TIRES TAB ───────────────────────────────────────────────────────
const TiresTab = ({ v }) => {
  const tires = v.tires ?? [];
  if (!tires.length) return <EmptyState icon={CircleDot} text="No tires found" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tires.map(t => (
        <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-black text-[#172B4D]">{t.tire_brand}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.tire_position_display ?? t.tire_position}</p>
            </div>
            <Badge className={t.status === 'INSTALLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
              {t.status_display ?? t.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Serial No." value={t.tire_serial_number} icon={Hash} />
            <InfoCard label="Tread Depth" value={t.tread_depth ? `${t.tread_depth} mm` : null} />
            <InfoCard label="Installed" value={t.installation_date} icon={Calendar} />
            <InfoCard label="Install Odo" value={t.installation_odometer ? `${Number(t.installation_odometer).toLocaleString()} km` : null} icon={Gauge} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── ACCESSORIES TAB ─────────────────────────────────────────────────
const AccessoriesTab = ({ v }) => {
  const items = v.accessories ?? [];
  if (!items.length) return <EmptyState icon={Package} text="No accessories found" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(a => (
        <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-black text-[#172B4D]">{a.accessory_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.accessory_type_display ?? a.accessory_type}</p>
            </div>
            <Badge className={a.status === 'INSTALLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
              {a.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Serial No." value={a.serial_number} icon={Hash} />
            <InfoCard label="Installed" value={a.installation_date} icon={Calendar} />
            <InfoCard label="Warranty" value={a.warranty_expiry} icon={Calendar} />
            {a.notes && <InfoCard label="Notes" value={a.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── TOLL TAGS TAB ────────────────────────────────────────────────────
const TollTagsTab = ({ v }) => {
  const tags = v.toll_tags ?? [];
  if (!tags.length) return <EmptyState icon={Tag} text="No toll tags found" />;
  return (
    <div className="space-y-4">
      {tags.map(t => (
        <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0052CC]/20 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-black text-[#172B4D] font-mono">{t.tag_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.tag_provider}</p>
            </div>
            <Badge className={t.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}>
              {t.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <InfoCard label="Balance" value={t.recharge_balance ? `₹${Number(t.recharge_balance).toLocaleString('en-IN')}` : null} icon={IndianRupee} />
            <InfoCard label="Issue Date" value={t.issue_date} icon={Calendar} />
            <InfoCard label="Expiry" value={t.expiry_date} icon={Calendar} />
            <InfoCard label="Bank A/C" value={t.linked_bank_account} icon={Hash} />
            {t.notes && <InfoCard label="Notes" value={t.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── OWNERSHIP TAB ────────────────────────────────────────────────────
const OwnershipTab = ({ v }) => {
  const history = v.ownership_history ?? [];
  return (
    <div className="space-y-4">
      {/* Current ownership */}
      <div className="bg-[#0052CC]/5 border border-[#0052CC]/20 rounded-xl p-5">
        <SectionTitle>Current Ownership</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Ownership Type" value={v.ownership_type_display ?? v.ownership_type} />
          <InfoCard label="Purchase Date" value={v.purchase_date} icon={Calendar} />
          <InfoCard label="Purchase Price" value={v.purchase_price ? `₹${Number(v.purchase_price).toLocaleString('en-IN')}` : null} icon={IndianRupee} />
          <InfoCard label="Assigned Driver" value={v.assigned_driver ?? 'Unassigned'} icon={User} />
        </div>
      </div>

      {/* History */}
      <div>
        <SectionTitle>Ownership History ({history.length})</SectionTitle>
        {!history.length
          ? <EmptyState icon={History} text="No ownership history available" />
          : <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-3 gap-3">
                  <InfoCard label="Owner" value={h.owner_name} icon={User} />
                  <InfoCard label="From" value={h.start_date} icon={Calendar} />
                  <InfoCard label="To" value={h.end_date ?? 'Present'} icon={Calendar} />
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
};

// ─── TAB CONTENT ROUTER ───────────────────────────────────────────────
const TabContent = ({ tab, v }) => {
  switch (tab) {
    case 'overview':    return <OverviewTab v={v} />;
    case 'documents':   return <DocumentsTab v={v} />;
    case 'insurance':   return <InsuranceTab v={v} />;
    case 'maintenance': return <MaintenanceTab v={v} />;
    case 'inspections': return <InspectionsTab v={v} />;
    case 'fuel':        return <FuelLogsTab v={v} />;
    case 'tires':       return <TiresTab v={v} />;
    case 'accessories': return <AccessoriesTab v={v} />;
    case 'tolltags':    return <TollTagsTab v={v} />;
    case 'ownership':   return <OwnershipTab v={v} />;
    default:            return null;
  }
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────
const VehicleDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: v, isLoading, isError, error, refetch } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();

  const handleToggle = () => {
    if (!v) return;
    updateVehicle.mutate({
      id: v.id,
      data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' },
    });
  };

  const handleEdit = () => navigate(`/tenant/dashboard/vehicles/${id}/edit`);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
        <span className="text-sm">Loading vehicle details...</span>
      </div>
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-red-400">
        <AlertCircle size={32} />
        <p className="text-sm font-medium">Failed to load vehicle</p>
        <p className="text-xs text-gray-400">{error?.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">Retry</button>
      </div>
    </div>
  );

  if (!v) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
        <span className="text-sm">Loading vehicle details...</span>
      </div>
    </div>
  );

  // ── Guard: data not yet available ─────────────────────────────────
  if (!v) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
        <span className="text-sm">Loading vehicle details...</span>
      </div>
    </div>
  );

  // Tab counts
  const countFor = (key) => {
    if (!v || !key) return null;
    const val = v[key];
    return Array.isArray(val) ? val.length : null;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/tenant/dashboard/vehicles')}
            className="flex items-center gap-1.5 font-semibold text-[#0052CC] hover:underline">
            <ArrowLeft size={14} /> Vehicles
          </button>
          <ChevronRight size={14} />
          <span className="font-semibold text-[#172B4D]">{v?.registration_number}</span>
        </div>

        {/* Header */}
        <VehicleHeader v={v} onEdit={handleEdit} onToggle={handleToggle} updating={updateVehicle.isPending} />

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            {TABS.map(tab => {
              const count = countFor(tab.key);
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-[13px] font-bold whitespace-nowrap border-b-2 transition-all shrink-0
                    ${isActive
                      ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/50'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {count != null && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                      ${isActive ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-6">
            <TabContent tab={activeTab} v={v} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleDetail;
