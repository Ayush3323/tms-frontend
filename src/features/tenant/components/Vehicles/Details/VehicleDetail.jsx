import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Pause, Play,
  Truck, FileText, Shield, Wrench, ClipboardCheck,
  Fuel, CircleDot, Package, Tag, History,
  Gauge, Calendar, User, IndianRupee,
  ChevronRight, Loader2, AlertCircle,
  Hash, Palette, Zap, BarChart3, Trash2,
} from 'lucide-react';
import {
  Badge, InfoCard, SectionHeader, EmptyState,
  FUEL_COLORS, STATUS_STYLES, fmtDate, fmtKm, fmtINR, driverName
} from '../Common/VehicleCommon';
import { VehicleFormModal } from '../Common/VehicleFormModal';
import { useVehicle, useUpdateVehicle, useDeleteVehicle } from '../../../queries/vehicles/vehicleQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

// Import Consolidated Features
import VehicleDocuments from '../Features/Documents';
import VehicleInsurance from '../Features/Insurance';
import VehicleMaintenance from '../Features/Maintenance';
import VehicleInspections from '../Features/Inspections';
import VehicleFuel from '../Features/Fuel';
import VehicleTires from '../Features/Tires';
import VehicleAccessories from '../Features/Accessories';
import VehicleTollTags from '../Features/TollTags';
import VehicleOwnership from '../Features/Ownership';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'documents', label: 'Documents', icon: FileText, key: 'documents' },
  { id: 'insurance', label: 'Insurance', icon: Shield, key: 'insurance_policies' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, key: 'maintenance_schedules' },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, key: 'inspections' },
  { id: 'fuel', label: 'Fuel Logs', icon: Fuel, key: 'fuel_logs' },
  { id: 'tires', label: 'Tires', icon: CircleDot, key: 'tires' },
  { id: 'accessories', label: 'Accessories', icon: Package, key: 'accessories' },
  { id: 'tolltags', label: 'Toll Tags', icon: Tag, key: 'toll_tags' },
  { id: 'ownership', label: 'Ownership', icon: History, key: 'ownership_history' },
];


// ═════════════════════════════════════════════════════════════════════════════
//  TAB CONTENT ROUTER
// ═════════════════════════════════════════════════════════════════════════════
const TabContent = ({ tab, v }) => {
  const vehicleId = v.id;

  switch (tab) {
    case 'overview':    return <OverviewTab v={v} />;
    case 'documents':   return <VehicleDocuments vehicleId={vehicleId} isTab />;
    case 'insurance':   return <VehicleInsurance vehicleId={vehicleId} isTab />;
    case 'maintenance': return <VehicleMaintenance vehicleId={vehicleId} isTab />;
    case 'inspections': return <VehicleInspections vehicleId={vehicleId} isTab />;
    case 'fuel':        return <VehicleFuel vehicleId={vehicleId} isTab />;
    case 'tires':       return <VehicleTires vehicleId={vehicleId} isTab />;
    case 'accessories': return <VehicleAccessories vehicleId={vehicleId} isTab />;
    case 'tolltags':    return <VehicleTollTags vehicleId={vehicleId} isTab />;
    case 'ownership':   return <VehicleOwnership vehicleId={vehicleId} isTab />;
    default:            return null;
  }
};


// ═════════════════════════════════════════════════════════════════════════════
//  OVERVIEW TAB  (unchanged)
// ═════════════════════════════════════════════════════════════════════════════
const OverviewTab = ({ v }) => {
  const st = STATUS_STYLES[v.status] ?? STATUS_STYLES.RETIRED;
  const activeInsurance = v.insurance_policies?.find(p => p.status === 'ACTIVE') ?? null;
  const nextMaint = v.maintenance_schedules?.find(m => m.status === 'SCHEDULED') ?? null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Status', value: v.status_display ?? v.status, color: st.color },
          { label: 'Odometer', value: fmtKm(v.current_odometer) ?? '—', color: 'text-[#172B4D]' },
          {
            label: 'Insurance', value: activeInsurance ? 'Active' : (v.insurance_policies?.length ? 'Expired' : 'None'),
            color: activeInsurance ? 'text-emerald-600' : 'text-red-500'
          },
          { label: 'Next Service', value: nextMaint?.scheduled_date ? fmtDate(nextMaint.scheduled_date) : 'Not scheduled', color: 'text-[#172B4D]' },
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
            <InfoCard label="Make" value={v.make} icon={Truck} />
            <InfoCard label="Model" value={v.model} />
            <InfoCard label="Year" value={v.year} icon={Calendar} />
            <InfoCard label="Type" value={v.vehicle_type?.type_name} icon={Truck} />
            <InfoCard label="Fuel" value={v.fuel_type_display ?? v.fuel_type} icon={Fuel} />
            <InfoCard label="Transmission" value={v.transmission_type_display ?? v.transmission_type} icon={Zap} />
            <InfoCard label="Color" value={v.color} icon={Palette} />
            <InfoCard label="VIN" value={v.vehicle_identification_number} icon={Hash} />
            <InfoCard label="Odometer" value={fmtKm(v.current_odometer)} icon={Gauge} />
            <InfoCard label="Status" value={v.status_display ?? v.status} />
            <InfoCard label="Ownership" value={v.ownership_type_display ?? v.ownership_type} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <SectionHeader icon={IndianRupee} title="Purchase Details" />
            <div className="grid grid-cols-2 gap-2.5">
              <InfoCard label="Purchase Date" value={fmtDate(v.purchase_date)} icon={Calendar} />
              <InfoCard label="Purchase Price" value={fmtINR(v.purchase_price)} icon={IndianRupee} accent />
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <SectionHeader icon={Gauge} title="Capacity" />
            <div className="grid grid-cols-2 gap-2.5">
              <InfoCard label="Tonnage" value={v.capacity_tonnage ? `${v.capacity_tonnage} T` : null} />
              <InfoCard label="Volume" value={v.capacity_volume ? `${v.capacity_volume} m³` : null} />
            </div>
          </div>
          {activeInsurance && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
              <SectionHeader icon={Shield} title="Active Insurance" />
              <p className="font-black text-[#172B4D] text-base font-mono">{activeInsurance.policy_number}</p>
              <p className="text-sm text-gray-500 mt-0.5">{activeInsurance.insurance_company} · {activeInsurance.policy_type_display}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100">
                <span className="text-xs text-gray-400">Expires</span>
                <span className="text-xs font-bold text-emerald-600">{fmtDate(activeInsurance.expiry_date)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  VEHICLE HEADER
// ═════════════════════════════════════════════════════════════════════════════
const VehicleHeader = ({ v, onEdit, onToggle, onDelete, updating }) => {
  const st = STATUS_STYLES[v.status] ?? STATUS_STYLES.RETIRED;
  const fuel = FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const lookup = useDriverLookup();
  const driver = typeof v.assigned_driver === 'object' ? v.assigned_driver : lookup[v.assigned_driver];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                <button onClick={onDelete} disabled={updating}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#172B4D] bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm shadow-gray-100 disabled:opacity-50">
                  <Trash2 size={14} /> Delete
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
              { label: 'Tonnage', value: v.capacity_tonnage ? `${v.capacity_tonnage} T` : null, icon: Truck },
              { label: 'Driver', value: driverName(driver ?? v.assigned_driver), icon: User },
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

// All feature tabs are now imported from ../Features/

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const { data: v, isLoading, isError, error, refetch } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const handleToggle = () => {
    if (!v) return;
    updateVehicle.mutate({ id: v.id, data: { status: v.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } });
  };
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      deleteVehicle.mutate(id, { onSuccess: () => navigate('/tenant/dashboard/vehicles') });
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const handleEdit = () => setIsEditModalOpen(true);

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
      <div className="mx-auto p-6 space-y-5">
        {isEditModalOpen && (
          <VehicleFormModal
            initial={v}
            onClose={() => {
              setIsEditModalOpen(false);
              refetch();
            }}
          />
        )}

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/tenant/dashboard/vehicles')}
            className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
            <ArrowLeft size={14} /> Vehicles
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{v.registration_number}</span>
        </div>

        <VehicleHeader v={v} onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} updating={updateVehicle.isPending || deleteVehicle.isPending} />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            {TABS.map(tab => {
              const count = countFor(tab.key);
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
