import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, MapPin, Calendar,
  Map as MapIcon, ChevronRight, Loader2,
  AlertCircle, Hash, Clock, CheckCircle2,
  User, Shield, FileText, Receipt, Edit3,
  CreditCard, History, Plus, ArrowRight,
  Gauge, Zap, DollarSign, Activity, Package as PackageIcon, Trash2, Save, X
} from 'lucide-react';
import {
  useTripDetail, useTripStops, useTripDocuments,
  useTripExpenses, useTripCharges, useTripStatusHistory,
  useOrderDetail, useDeleteTrip, useCreateTripStop,
  useUpdateTripStop, useDeleteTripStop, useTripDeliveries, useCreatePOD,
  useUpdateTripExpense, useDeleteTripExpense, useUpdateTripCharge, useDeleteTripCharge, useUpdateTrip,
  useTripCargoItems, useTransitionCargoStatus,
} from '../../queries/orders/ordersQuery';
import { useDriverDetail } from '../../queries/drivers/driverCoreQuery';
import { useVehicle } from '../../queries/vehicles/vehicleQuery';
import { EditTripModal, AddStopsModal } from './TripModals';
import { CreateCargoModal } from './CargoModals';
import { useCurrentUser } from '../../queries/users/rolesPermissionsQuery';

// --- Shared Components ---
const Badge = ({ children, className = "", pulse = false }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all shadow-sm ${className} ${pulse ? 'ring-2 ring-current/20' : ''}`}>
    {pulse && <span className="flex h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-5 border-b border-gray-100/50 pb-3">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg bg-blue-50/50 text-[#0052CC]">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <h3 className="text-[11px] font-black text-[#172B4D] uppercase tracking-[0.1em]">{title}</h3>
    </div>
    {action}
  </div>
);

const EditFinanceModal = ({ isOpen, onClose, value, onChange, onSubmit, isPending, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f172a]/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#172B4D]">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <input type="number" required step="0.01" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#4a6cf7]" placeholder="Amount" value={value.amount} onChange={(e) => onChange((p) => ({ ...p, amount: e.target.value }))} />
          <textarea rows="3" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#4a6cf7]" placeholder="Description" value={value.description} onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))} />
          <button type="submit" disabled={isPending} className="w-full py-2.5 rounded-lg bg-[#4a6cf7] text-white font-bold text-sm hover:bg-[#3b59d9] disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

const LABEL_MAP = {
  status: 'Status',
  trip_number: 'Trip Number',
  lr_number: 'LR Number',
  trip_type: 'Trip Type',
  origin_address: 'Origin',
  destination_address: 'Destination',
  reference_number: 'Reference Number',
  created_date: 'Created Date',
  version: 'Version',
  created_at: 'Created At',
  updated_at: 'Updated At',
  primary_driver_id: 'Primary Driver',
  primary_vehicle_id: 'Primary Vehicle',
  vehicle_owner_name: 'Vehicle Owner',
  vehicle_type_code: 'Vehicle Type',
  alternate_driver_id: 'Alternate Driver',
  alternate_vehicle_id: 'Alternate Vehicle',
  scheduled_pickup_date: 'Scheduled Pickup',
  scheduled_delivery_date: 'Scheduled Delivery',
  actual_pickup_date: 'Actual Pickup',
  actual_delivery_date: 'Actual Delivery',
  start_time: 'Start Time',
  end_time: 'End Time',
  total_distance_km: 'Total Distance',
  start_odometer_km: 'Start Odometer',
  end_odometer_km: 'End Odometer',
  estimated_fuel_liters: 'Estimated Fuel',
  actual_fuel_liters: 'Actual Fuel',
  fuel_rate_per_liter: 'Fuel Rate/L',
  total_bill_amount: 'Total Bill',
  total_freight_charge: 'Freight',
  total_accessorial_charge: 'Accessorial',
  total_tax: 'Tax',
  is_paid: 'Paid',
  is_billed: 'Billed',
  broker_commission: 'Broker Commission',
  booked_price: 'Booked Price',
  part_load_charge: 'Part-load Charge',
  tds_percentage: 'TDS %',
  tds_amount: 'TDS Amount',
  late_fee: 'Late Fee',
  damage_amount: 'Damage Amount',
  incentive_amount: 'Incentive',
  payment_received_amount: 'Payment Received',
  payment_received_date: 'Payment Date',
  pod_turnaround_days: 'POD TAT (days)',
};

const formatDateTime = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  // If it's just a date (YYYY-MM-DD), show as date
  if (typeof val === 'string' && val.length === 10) {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const TRIP_TRANSITIONS = {
  CREATED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELAYED', 'ARRIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELAYED: ['IN_TRANSIT', 'CANCELLED'],
  ARRIVED: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const InfoCard = ({ label, value, icon: Icon, accent = false, isLoading = false }) => (
  <div className={`p-4 rounded-2xl border transition-all ${
    accent 
      ? 'bg-blue-50/50 border-blue-100 hover:border-blue-200' 
      : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
  }`}>
    <div className="flex items-center gap-4">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
            : 'bg-gray-50 text-gray-400'
        }`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none mb-1.5">
          {LABEL_MAP[label] || label}
        </p>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-5 w-24 bg-gray-100 animate-pulse rounded-md" />
          ) : (
            <p className={`text-sm font-black tracking-tight truncate ${accent ? 'text-blue-700' : 'text-[#172B4D]'}`}>
              {value || '—'}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const DataRow = ({ label, value, icon: Icon }) => {
  return (
    <div className="group flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-all px-2 rounded-lg">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-gray-50/80 text-gray-400 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-blue-600 transition-all border border-transparent group-hover:border-blue-100 shadow-sm">
            <Icon size={15} strokeWidth={2.5} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
            {LABEL_MAP[label] || label}
          </span>
        </div>
      </div>
      <div className="text-right pl-6 flex-1 min-w-0">
        <p className="text-sm font-black text-[#172B4D] break-words line-clamp-2 leading-tight tracking-tight uppercase">
          {value || '—'}
        </p>
      </div>
    </div>
  );
};

// --- Tabs ---
const OverviewTab = ({
  trip,
  order,
  navigate,
  originDisplay,
  destinationDisplay,
  linkedOrders,
  stops,
  activeOrderTab,
  setActiveOrderTab,
}) => {
  const routeStops = (stops || []).filter((s) => String(s.order_id || '') === String(activeOrderTab || ''));
  return (
  <div className="space-y-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InfoCard label="status" value={trip.status} icon={Clock} accent />
      <InfoCard label="trip_number" value={trip.trip_number} icon={Hash} />
      <InfoCard label="lr_number" value={trip.lr_number} icon={FileText} />
      <InfoCard label="trip_type" value={trip.trip_type} icon={Truck} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={MapPin} title="Route Summary" />
        <div className="mb-4 flex flex-wrap gap-2">
          {linkedOrders.map((o) => (
            <button
              key={o.order_id}
              type="button"
              onClick={() => setActiveOrderTab(o.order_id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${
                String(activeOrderTab) === String(o.order_id)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {o.lr_number || 'LR'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="origin_address" value={originDisplay} icon={MapPin} />
          <DataRow label="destination_address" value={destinationDisplay} icon={MapPin} />
          {routeStops.map((stop) => (
            <DataRow
              key={stop.id}
              label={`Stop #${stop.stop_sequence} (${stop.stop_type})`}
              value={stop.location_address}
              icon={MapPin}
            />
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 inline-block">
            Managed via Stops tab
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={Calendar} title="Reference Details" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="lr_number" value={order?.lr_number || trip.lr_number} icon={FileText} />
          <DataRow label="reference_number" value={trip.reference_number} icon={Hash} />
          <DataRow label="created_date" value={formatDateTime(trip.created_date)} icon={Calendar} />
          <DataRow label="Pickup Date" value={order?.pickup_date || '—'} icon={Calendar} />
          <DataRow label="Delivery Date" value={order?.delivery_date || '—'} icon={CheckCircle2} />
          <DataRow
            label="Linked LRs"
            value={linkedOrders.map((o) => o.lr_number).filter(Boolean).join(', ') || '—'}
            icon={FileText}
          />
        </div>
        {trip.order_id && (
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-6 py-3 text-[11px] font-black text-[#0052CC] bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest shadow-sm"
              onClick={() => navigate(`/tenant/dashboard/orders/${trip.order_id}`)}
            >
              View Order
            </button>
          </div>
        )}
      </div>
    </div>

    {trip.remarks && (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <SectionHeader icon={FileText} title="Trip Remarks" />
        <p className="text-sm text-[#172B4D] font-bold italic leading-relaxed">"{trip.remarks}"</p>
      </div>
    )}

    <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-8">
      <SectionHeader icon={Shield} title="Technical Audit Information" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DataRow label="version" value={trip.version} icon={Hash} />
        <DataRow label="created_at" value={new Date(trip.created_at).toLocaleString()} icon={Clock} />
        <DataRow label="updated_at" value={new Date(trip.updated_at).toLocaleString()} icon={Clock} />
      </div>
    </div>
  </div>
  );
};

const JourneyTab = ({ trip, driver, vehicle, isLoadingNames, altDriver, altVehicle }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={User} title="Fleet & Crew Allocation" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="primary_driver_id" value={driver} icon={User} />
          <DataRow label="primary_vehicle_id" value={vehicle} icon={Truck} />
          <DataRow label="vehicle_owner_name" value={trip.vehicle_owner_name} icon={User} />
          <DataRow label="vehicle_type_code" value={trip.vehicle_type_code} icon={Truck} />
          <DataRow label="alternate_driver_id" value={altDriver} icon={User} />
          <DataRow label="alternate_vehicle_id" value={altVehicle} icon={Truck} />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={Clock} title="Schedule & Timing" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="scheduled_pickup_date" value={formatDateTime(trip.scheduled_pickup_date)} icon={Calendar} />
          <DataRow label="scheduled_delivery_date" value={formatDateTime(trip.scheduled_delivery_date)} icon={CheckCircle2} />
          <DataRow label="actual_pickup_date" value={formatDateTime(trip.actual_pickup_date)} icon={Clock} />
          <DataRow label="actual_delivery_date" value={formatDateTime(trip.actual_delivery_date)} icon={CheckCircle2} />
          <DataRow label="start_time" value={formatDateTime(trip.start_time)} icon={Zap} />
          <DataRow label="end_time" value={formatDateTime(trip.end_time)} icon={Zap} />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <SectionHeader icon={Gauge} title="Performance & Fuel Metrics" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2">
        <DataRow label="total_distance_km" value={trip.total_distance_km ? `${trip.total_distance_km} KM` : '—'} icon={MapIcon} />
        <DataRow label="start_odometer_km" value={trip.start_odometer_km ? `${trip.start_odometer_km} KM` : '—'} icon={Gauge} />
        <DataRow label="end_odometer_km" value={trip.end_odometer_km ? `${trip.end_odometer_km} KM` : '—'} icon={Gauge} />
        <DataRow label="estimated_fuel_liters" value={trip.estimated_fuel_liters ? `${trip.estimated_fuel_liters} L` : '—'} icon={Zap} />
        <DataRow label="actual_fuel_liters" value={trip.actual_fuel_liters ? `${trip.actual_fuel_liters} L` : '—'} icon={Zap} />
        <DataRow label="fuel_rate_per_liter" value={trip.fuel_rate_per_liter ? `${trip.fuel_rate_per_liter} / L` : '—'} icon={DollarSign} />
      </div>
    </div>
  </div>
);

const StopsTab = ({ tripId, stops, isLoading, onCreateStop, onUpdateStopStatus, onDeleteStop }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stopFilters, setStopFilters] = useState({
    stop_sequence: '',
    stop_type: 'ALL',
    location_address: '',
  });
  const [editingStopId, setEditingStopId] = useState(null);
  const [editingStop, setEditingStop] = useState({ location_address: '', instructions: '' });

  const stopRows = [...(stops || [])];
  
  const filteredStops = stopRows.filter(stop => {
    const matchSeq = !stopFilters.stop_sequence || String(stop.stop_sequence) === String(stopFilters.stop_sequence);
    const matchType = stopFilters.stop_type === 'ALL' || stop.stop_type === stopFilters.stop_type;
    const matchLoc = !stopFilters.location_address || 
      (stop.location_address || '').toLowerCase().includes(stopFilters.location_address.toLowerCase());
    return matchSeq && matchType && matchLoc;
  });

  const sortedStops = filteredStops.sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));
  const nextSeq = stopRows.length > 0 ? Math.max(...stopRows.map(s => s.stop_sequence || 0)) + 1 : 1;

  const startEditStop = (stop) => {
    setEditingStopId(stop.id);
    setEditingStop({
      location_address: stop.location_address || '',
      instructions: stop.instructions || '',
    });
  };

  const saveEditStop = (stopId) => {
    onUpdateStopStatus(stopId, undefined, {
      location_address: editingStop.location_address,
      instructions: editingStop.instructions,
    });
    setEditingStopId(null);
    setEditingStop({ location_address: '', instructions: '' });
  };
  

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={MapPin} 
        title="Trip Sequence (Multi-point)" 
      />

      <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
         <div className="w-16">
            <input 
              type="number" 
              min="1"
              className="w-full p-2 bg-gray-100/50 border border-gray-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400"
              value={stopFilters.stop_sequence} 
              onChange={e => {
                const val = e.target.value;
                if (val !== '' && parseInt(val) < 1) return;
                setStopFilters({...stopFilters, stop_sequence: val});
              }} 
              placeholder="Seq"
            />
         </div>
         <div className="w-28">
            <select 
              className="w-full p-2 bg-gray-100/50 border border-gray-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400"
              value={stopFilters.stop_type} 
              onChange={e => setStopFilters({...stopFilters, stop_type: e.target.value})}
            >
               <option value="ALL">ALL TYPES</option>
               <option value="PICKUP">PICKUP</option>
               <option value="DELIVERY">DELIVERY</option>
               <option value="TRANSIT">TRANSIT</option>
               <option value="FUEL">FUEL</option>
               <option value="BREAK">BREAK</option>
               <option value="OTHER">OTHER</option>
            </select>
         </div>
         <div className="w-64">
            <input 
              className="w-full p-2 bg-gray-100/50 border border-gray-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400"
              value={stopFilters.location_address} 
              onChange={e => setStopFilters({...stopFilters, location_address: e.target.value})} 
              placeholder="Filter by Location"
            />
         </div>
         {(stopFilters.stop_sequence || stopFilters.stop_type !== 'ALL' || stopFilters.location_address) && (
            <button 
              onClick={() => setStopFilters({ stop_sequence: '', stop_type: 'ALL', location_address: '' })}
              className="px-3 py-2 text-[10px] font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase tracking-widest transition-all rounded-xl border border-transparent hover:border-blue-100 shadow-sm"
            >
              Clear
            </button>
         )}
         <div className="ml-auto flex items-center gap-2">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center gap-2 px-6 py-2 bg-[#4a6cf7] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#3b59d9] transition-all shadow-lg shadow-blue-100 active:scale-95"
           >
             <Plus size={14} strokeWidth={3} /> Add Stop
           </button>
         </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : sortedStops.length > 0 ? (
        <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
          {sortedStops.map((stop) => (
            <div key={stop.id} className="relative">
              <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${stop.stop_status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} />
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-1 gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Stop #{stop.stop_sequence} • {stop.stop_type}
                  </span>
                  <Badge className={stop.stop_status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}>
                    {stop.stop_status}
                  </Badge>
                </div>
                <p className="text-sm font-black text-[#172B4D]">{stop.location_address || '-'}</p>
                <p className="text-xs text-gray-500 font-medium">{stop.instructions || 'No instructions'}</p>
                {editingStopId === stop.id ? (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="md:col-span-2 px-2 py-1 text-xs rounded border border-gray-200"
                      value={editingStop.location_address}
                      onChange={(e) => setEditingStop((p) => ({ ...p, location_address: e.target.value }))}
                      placeholder="Location address"
                    />
                    <input
                      className="px-2 py-1 text-xs rounded border border-gray-200"
                      value={editingStop.instructions}
                      onChange={(e) => setEditingStop((p) => ({ ...p, instructions: e.target.value }))}
                      placeholder="Instructions"
                    />
                    <div className="md:col-span-3 flex gap-2">
                      <button type="button" onClick={() => saveEditStop(stop.id)} className="px-2 py-1 text-xs rounded bg-blue-600 text-white">Save</button>
                      <button type="button" onClick={() => setEditingStopId(null)} className="px-2 py-1 text-xs rounded bg-gray-100">Cancel</button>
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button type="button" onClick={() => onUpdateStopStatus(stop.id, 'PENDING')} className={`px-2 py-1 text-xs rounded ${stop.stop_status === 'PENDING' ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>Pending</button>
                  <button type="button" onClick={() => onUpdateStopStatus(stop.id, 'IN_PROGRESS')} className={`px-2 py-1 text-xs rounded ${stop.stop_status === 'IN_PROGRESS' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>In Progress</button>
                  <button type="button" onClick={() => onUpdateStopStatus(stop.id, 'COMPLETED')} className={`px-2 py-1 text-xs rounded ${stop.stop_status === 'COMPLETED' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'}`}>Completed</button>
                  <button type="button" onClick={() => startEditStop(stop)} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">Edit</button>
                  <button type="button" onClick={() => onDeleteStop(stop.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No stops recorded for this trip.</p>
        </div>
      )}
      <AddStopsModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId}
        nextSequenceNumber={nextSeq}
      />
    </div>
  );
};

const DeliveriesTab = ({ tripId, deliveries, stops, createDelivery, isCreating }) => {
  const deliveryStops = (stops || []).filter((s) => s.stop_type === 'DELIVERY');
  const [form, setForm] = useState({
    trip_stop: '',
    delivery_date: '',
    received_by_name: '',
    received_by_relation: '',
    delivery_status: 'DELIVERED',
    remarks: '',
    pod_number: '',
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.trip_stop && deliveryStops.length > 1) {
      return;
    }
    createDelivery({
      trip_id: tripId,
      trip_stop: form.trip_stop || undefined,
      ...form,
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={FileText} title="Deliveries / POD" />
      <form onSubmit={onSubmit} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Delivery Stop</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              value={form.trip_stop}
              onChange={(e) => setForm((p) => ({ ...p, trip_stop: e.target.value }))}
              required={deliveryStops.length > 1}
            >
              <option value="">Select delivery stop</option>
              {deliveryStops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  #{stop.stop_sequence} - {stop.location_address || 'Delivery Stop'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Delivery Date</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" value={form.delivery_date} onChange={(e) => setForm((p) => ({ ...p, delivery_date: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Received By</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Receiver name" value={form.received_by_name} onChange={(e) => setForm((p) => ({ ...p, received_by_name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Relation</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Receiver relation" value={form.received_by_relation} onChange={(e) => setForm((p) => ({ ...p, received_by_relation: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Delivery Status</label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" value={form.delivery_status} onChange={(e) => setForm((p) => ({ ...p, delivery_status: e.target.value }))}>
              <option value="DELIVERED">DELIVERED</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="REFUSED">REFUSED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">POD Number</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Optional POD number" value={form.pod_number} onChange={(e) => setForm((p) => ({ ...p, pod_number: e.target.value }))} />
          </div>
          <button type="submit" disabled={isCreating} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold">
            {isCreating ? 'Creating...' : 'Create Delivery'}
          </button>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Remarks</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" rows={2} placeholder="Remarks" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
        </div>
      </form>

      <div className="space-y-3">
        {deliveries?.length ? deliveries.map((d) => (
          <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-sm font-black text-[#172B4D]">{d.pod_number || d.id}</p>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">{d.delivery_status}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">Date: {d.delivery_date}</p>
            <p className="text-xs text-gray-500">Receiver: {d.received_by_name}</p>
          </div>
        )) : (
          <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No deliveries recorded for this trip.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FinanceTab = ({ trip, expenses, charges, isLoadingExp, isLoadingChg, onEditFinance, onDeleteFinance }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="total_bill_amount" value={`₹ ${trip.total_bill_amount || '0.00'}`} icon={DollarSign} accent />
        <InfoCard label="total_freight_charge" value={`₹ ${trip.total_freight_charge}`} icon={Receipt} />
        <InfoCard label="total_accessorial_charge" value={`₹ ${trip.total_accessorial_charge}`} icon={Plus} />
        <InfoCard label="total_tax" value={`₹ ${trip.total_tax}`} icon={Shield} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={CreditCard} title="Commissions & Deductibles" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="broker_commission" value={`₹ ${trip.broker_commission || '0.00'}`} icon={DollarSign} />
          <DataRow label="booked_price" value={`₹ ${trip.booked_price || '0.00'}`} icon={DollarSign} />
          <DataRow label="part_load_charge" value={`₹ ${trip.part_load_charge || '0.00'}`} icon={PackageIcon} />
          <DataRow label="tds_percentage" value={`${trip.tds_percentage || '0.00'} %`} icon={Activity} />
          <DataRow label="tds_amount" value={`₹ ${trip.tds_amount || '0.00'}`} icon={DollarSign} />
          <DataRow label="late_fee" value={`₹ ${trip.late_fee || '0.00'}`} icon={AlertCircle} />
          <DataRow label="damage_amount" value={`₹ ${trip.damage_amount || '0.00'} (${trip.damage_count || 0} items)`} icon={AlertCircle} />
          <DataRow label="incentive_amount" value={`₹ ${trip.incentive_amount || '0.00'}`} icon={Plus} />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={Clock} title="Payment Settlement" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="payment_received_amount" value={`₹ ${trip.payment_received_amount || '0.00'}`} icon={DollarSign} />
          <DataRow label="payment_received_date" value={trip.payment_received_date} icon={Calendar} />
          <DataRow label="pod_received_date" value={trip.pod_received_date} icon={FileText} />
          <DataRow label="pod_turnaround_days" value={`${trip.pod_turnaround_days || '—'} Days`} icon={Clock} />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <SectionHeader icon={Receipt} title="Expense & Charge Records" />
      {(isLoadingExp || isLoadingChg) ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {[...(expenses || []).map(e => ({ ...e, res_type: 'EXPENSE', label: e.expense_type })), ...(charges || []).map(c => ({ ...c, res_type: 'CHARGE', label: c.charge_type }))].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.res_type === 'EXPENSE' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                   {item.res_type === 'EXPENSE' ? <Receipt size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <p className="text-sm font-black text-[#172B4D] uppercase tracking-tight">{item.label || item.res_type}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.res_type} • {item.status || 'PENDING'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-lg font-black text-[#172B4D] tracking-tighter">₹ {item.amount || '0.00'}</p>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onEditFinance(item)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Edit3 size={14} />
                    </button>
                    <button type="button" onClick={() => onDeleteFinance(item)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 size={14} />
                    </button>
                </div>
              </div>
            </div>
          ))}
          {((expenses || []).length + (charges || []).length) === 0 && (
            <div className="text-center p-12 text-sm text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                No expense or charge records found.
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const CargoTab = ({ tripId, onOpenCreate }) => {
  const { data, isLoading } = useTripCargoItems(tripId, { ordering: '-created_at' });
  const transitionCargo = useTransitionCargoStatus();
  const rows = data?.results || (Array.isArray(data) ? data : []);
  const transitions = {
    PENDING: ['LOADED'],
    LOADED: ['UNLOADED', 'DAMAGED', 'SHORT'],
    UNLOADED: ['DAMAGED'],
    DAMAGED: [],
    SHORT: [],
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={PackageIcon}
        title="Trip Cargo"
        action={
          <button type="button" onClick={onOpenCreate} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
            Add Cargo Item
          </button>
        }
      />
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No cargo linked to this trip.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((item) => (
            <div key={item.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#172B4D]">{item.item_code || item.id.slice(-8)} - {item.description}</p>
                <p className="text-xs text-gray-500">{item.commodity_type || 'GENERAL'} | Qty {item.quantity} | {item.status}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/tenant/dashboard/orders/cargo/${item.id}`} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">View</a>
                {(transitions[item.status] || []).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => transitionCargo.mutate({ id: item.id, newStatus: status })}
                    className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700"
                  >
                    Move to {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryTab = ({ history, isLoading }) => {
    const { data: currentUser } = useCurrentUser();
    
    const DetailItem = ({ label, value }) => (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-[12px] font-bold text-gray-800 break-words leading-tight">{value || '—'}</span>
      </div>
    );

    return (
      <div className="space-y-4">
        <SectionHeader icon={History} title="Trip Lifecycle (Status History)" />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : history?.length > 0 ? (
          <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {[...history].reverse().map((h, i) => (
              <div key={h.id} className="relative group/history">
                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 bg-blue-500" />
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex justify-between items-center transition-all hover:border-[#4a6cf7]/30 hover:shadow-md relative cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">{new Date(h.created_at || h.changed_at).toLocaleString()}</span>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold">{h.status}</Badge>
                    </div>
                    <p className="text-sm font-black text-[#172B4D] leading-tight">{h.remarks || h.notes || `Status transitioned to ${h.status}`}</p>
                  </div>
                  <div className="text-right mr-4 shrink-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Changed By</p>
                      <p className="text-sm font-black text-[#172B4D] uppercase">{h.user?.username || currentUser?.username || 'System'}</p>
                  </div>

                  {/* Hover Detail Card (Centered-Top with overflow fix) */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[110%] mb-3 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 z-[100] opacity-0 invisible group-hover/history:opacity-100 group-hover/history:visible transition-all duration-300 pointer-events-none scale-95 group-hover/history:scale-100 origin-bottom border-b-4 border-b-[#4a6cf7]">
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45" />
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                          <DetailItem label="Status" value={h.status} />
                          <DetailItem label="Changed At" value={new Date(h.changed_at).toLocaleTimeString()} />
                          <DetailItem label="Latitude" value={h.latitude} />
                          <DetailItem label="Longitude" value={h.longitude} />
                          <DetailItem label="Created At" value={new Date(h.created_at).toLocaleString()} />
                          <DetailItem label="Changed By ID" value={h.changed_by} />
                          <div className="col-span-2 border-t border-gray-50 pt-3">
                             <DetailItem label="Remarks" value={h.remarks || '—'} />
                          </div>
                          <div className="col-span-2">
                             <DetailItem label="Additional Data" value={Object.keys(h.additional_data || {}).length > 0 ? JSON.stringify(h.additional_data) : '{}'} />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No status changes recorded.</p>
          </div>
        )}
      </div>
    );
  };

// --- Main COMPONENT ---
export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrderTab, setActiveOrderTab] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateCargoOpen, setIsCreateCargoOpen] = useState(false);
  const [editFinanceItem, setEditFinanceItem] = useState(null);
  const [editFinanceForm, setEditFinanceForm] = useState({ amount: '', description: '' });
  const deleteTripMutation = useDeleteTrip();

  const handleBack = () => navigate('/tenant/dashboard/orders/trips');

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      deleteTripMutation.mutate(id, {
        onSuccess: () => handleBack()
      });
    }
  };

  const { data: trip, isLoading, isError } = useTripDetail(id);
  const { data: order } = useOrderDetail(trip?.order_id);
  const { data: stops, isLoading: loadingStops } = useTripStops(id);
  const { data: expenses, isLoading: loadingExp } = useTripExpenses(id);
  const { data: charges, isLoading: loadingChg } = useTripCharges(id);
  const { data: docs } = useTripDocuments(id);
  const { data: history, isLoading: loadingHistory } = useTripStatusHistory(id);
  const { data: tripDeliveries } = useTripDeliveries(id);
  const linkedOrders = trip?.linked_orders?.length
    ? trip.linked_orders
    : (trip?.order_id ? [{ order_id: trip.order_id, lr_number: trip.lr_number, reference_number: trip.reference_number }] : []);

  useEffect(() => {
    if (!activeOrderTab && linkedOrders.length) {
      setActiveOrderTab(linkedOrders[0].order_id);
    }
  }, [activeOrderTab, linkedOrders]);

  const createStopMutation = useCreateTripStop(id);
  const updateStopMutation = useUpdateTripStop(id);
  const deleteStopMutation = useDeleteTripStop(id);
  const createPODMutation = useCreatePOD();
  const updateTripMutation = useUpdateTrip();
  const updateExpenseMutation = useUpdateTripExpense(id);
  const deleteExpenseMutation = useDeleteTripExpense(id);
  const updateChargeMutation = useUpdateTripCharge(id);
  const deleteChargeMutation = useDeleteTripCharge(id);

  const handleEditFinance = (item) => {
    setEditFinanceItem(item);
    setEditFinanceForm({
      amount: item.amount ?? '',
      description: item.description || item.remarks || '',
    });
  };

  const handleDeleteFinance = (item) => {
    if (!window.confirm(`Delete this ${item.res_type.toLowerCase()} record?`)) return;
    if (item.res_type === 'EXPENSE') {
      deleteExpenseMutation.mutate(item.id);
    } else {
      deleteChargeMutation.mutate(item.id);
    }
  };

  const closeEditFinanceModal = () => {
    setEditFinanceItem(null);
    setEditFinanceForm({ amount: '', description: '' });
  };

  const handleSaveFinance = (e) => {
    e.preventDefault();
    if (!editFinanceItem) return;
    const payload = {
      amount: editFinanceForm.amount,
      description: editFinanceForm.description,
    };
    if (editFinanceItem.res_type === 'EXPENSE') {
      updateExpenseMutation.mutate(
        { expenseId: editFinanceItem.id, data: payload },
        { onSuccess: closeEditFinanceModal }
      );
    } else {
      updateChargeMutation.mutate(
        { chargeId: editFinanceItem.id, data: payload },
        { onSuccess: closeEditFinanceModal }
      );
    }
  };

  const driverId = trip?.primary_driver_id || trip?.driver_id;
  const vehicleId = trip?.primary_vehicle_id || trip?.vehicle_id;
  const altDriverId = trip?.alternate_driver_id;
  const altVehicleId = trip?.alternate_vehicle_id;

  const { data: driver, isLoading: loadingDriver } = useDriverDetail(driverId);
  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(vehicleId);
  const { data: altDriver } = useDriverDetail(altDriverId);
  const { data: altVehicle } = useVehicle(altVehicleId);

  const getDriverDisplay = (d, id, fallback) => {
    if (!id || id === 'null') return 'Unassigned';
    return d ? `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim() : (fallback || 'Unassigned');
  };

  const getVehicleDisplay = (v, id, fallback) => {
    if (!id || id === 'null') return 'Unassigned';
    return v ? (v.registration_number || v.registration) : (fallback || 'Unassigned');
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (isError || !trip) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#172B4D]">Trip Not Found</h2>
      <button onClick={handleBack} className="mt-4 text-[#0052CC] font-bold hover:underline">Back to Trips</button>
    </div>
  );

  const statusMap = {
    CREATED: { bg: 'bg-blue-50', color: 'text-blue-600', dot: 'bg-blue-600' },
    ASSIGNED: { bg: 'bg-indigo-50', color: 'text-indigo-600', dot: 'bg-indigo-600' },
    DISPATCHED: { bg: 'bg-cyan-50', color: 'text-cyan-600', dot: 'bg-cyan-600' },
    IN_TRANSIT: { bg: 'bg-indigo-50', color: 'text-indigo-600', dot: 'bg-indigo-600' },
    DELAYED: { bg: 'bg-amber-50', color: 'text-amber-600', dot: 'bg-amber-600' },
    ARRIVED: { bg: 'bg-purple-50', color: 'text-purple-600', dot: 'bg-purple-600' },
    DELIVERED: { bg: 'bg-emerald-50', color: 'text-emerald-600', dot: 'bg-emerald-600' },
    COMPLETED: { bg: 'bg-green-50', color: 'text-green-600', dot: 'bg-green-600' },
    CANCELLED: { bg: 'bg-rose-50', color: 'text-rose-600', dot: 'bg-rose-600' },
  };
  const st = statusMap[trip.status] || statusMap.CREATED;
  const nextStatuses = TRIP_TRANSITIONS[trip.status] || [];
  const stopRows = Array.isArray(stops) ? stops : stops?.results || [];
  const sortedStops = [...stopRows].sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));
  const firstPickupStop = sortedStops.find((s) => s.stop_type === 'PICKUP' && (s.location_address || '').trim());
  const deliveryStops = sortedStops.filter((s) => s.stop_type === 'DELIVERY' && (s.location_address || '').trim());
  const lastDeliveryStop = deliveryStops.length ? deliveryStops[deliveryStops.length - 1] : null;
  const originDisplay = firstPickupStop?.location_address || trip.origin_address || trip.origin || 'Delhi';
  const destinationDisplay = lastDeliveryStop?.location_address || trip.destination_address || trip.destination || 'Mumbai';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: MapIcon },
    { id: 'journey', label: 'Journey & Fleet', icon: Truck },
    { id: 'finance', label: 'Financials', icon: Receipt },
    { id: 'cargo', label: 'Cargo', icon: PackageIcon },
    { id: 'stops', label: 'Stops', icon: MapPin, count: (Array.isArray(stops) ? stops : stops?.results)?.length },
    { id: 'history', label: 'Status History', icon: History, count: (Array.isArray(history) ? history : history?.results)?.length },
    { id: 'deliveries', label: 'Deliveries', icon: FileText, count: (Array.isArray(tripDeliveries) ? tripDeliveries : tripDeliveries?.results)?.length },
    { id: 'docs', label: 'Documents', icon: FileText, count: docs?.length },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4">
          <button onClick={handleBack} className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">Trips</button>
          <ChevronRight size={10} className="text-gray-300" strokeWidth={3} />
          <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 cursor-default">{trip.trip_number}</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100/80 overflow-hidden shadow-xl shadow-gray-200/40">
          <div className="p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 flex items-center justify-between max-w-5xl gap-12">
              {/* Origin */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Origin</p>
                <h1 className="text-2xl font-bold text-[#172B4D] leading-tight break-words">{originDisplay}</h1>
                <p className="text-[11px] font-semibold text-gray-400 mt-1">Managed via Stops tab</p>
              </div>

              {/* Middle Line */}
              <div className="flex-1 flex flex-col items-center justify-center min-w-[80px]">
                <div className="w-full flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100 rounded-full" />
                    <ArrowRight size={14} className="text-blue-500" />
                    <div className="h-px flex-1 bg-gray-100 rounded-full" />
                </div>
              </div>

              {/* Destination */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Destination</p>
                <h1 className="text-2xl font-bold text-[#172B4D] leading-tight break-words">{destinationDisplay}</h1>
                <p className="text-[11px] font-semibold text-gray-400 mt-1">Managed via Stops tab</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => setIsEditOpen(true)} 
                className="flex items-center gap-2.5 px-6 py-3 bg-[#4a6cf7] border border-[#4a6cf7] rounded-xl text-sm font-semibold text-white hover:bg-[#3b59d9] hover:border-[#3b59d9] cursor-pointer transition-all shadow-md shadow-blue-200/40">
                <Edit3 size={14} strokeWidth={2.5} /> Edit Trip
              </button>
              <button onClick={handleDelete} 
                disabled={deleteTripMutation.isLoading}
                className="flex items-center gap-2.5 px-6 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 cursor-pointer transition-all">
                <Trash2 size={14} strokeWidth={2.5} /> {deleteTripMutation.isLoading ? 'Deleting...' : 'Delete Trip'}
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="px-8 pb-8 flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${st.bg} ${st.color}`}>
                  <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                  {trip.status}
              </div>
              <div className="px-3 py-1.5 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                  {trip.trip_type || 'FTL'}
              </div>
              {linkedOrders.length ? linkedOrders.map((linked) => (
                <button
                  key={linked.order_id}
                  type="button"
                  onClick={() => navigate(`/tenant/dashboard/orders/${linked.order_id}`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Hash size={10} className="text-gray-200" />
                  {linked.lr_number || 'LR-PENDING'}
                </button>
              )) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500">
                  <Hash size={10} className="text-gray-200" />
                  {order?.lr_number || trip.lr_number || 'LR-PENDING'}
                </div>
              )}
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateTripMutation.mutate({ id: trip.id, data: { status } })}
                  disabled={updateTripMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  Move to {status}
                </button>
              ))}
          </div>

          {/* Bottom Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-t border-gray-50">
            {/* Driver */}
            <div className="p-6 border-r border-gray-50 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <User size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Driver</p>
                    <p className="text-base font-black text-blue-600 leading-none mb-1 tracking-tight truncate">{getDriverDisplay(driver, driverId, trip?.primary_driver_name)}</p>
                </div>
            </div>

            {/* Vehicle */}
            <div className="p-6 border-r border-gray-50 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Truck size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Vehicle</p>
                    <p className="text-base font-black text-[#172B4D] leading-none mb-1 tracking-tight truncate">{getVehicleDisplay(vehicle, vehicleId, trip?.vehicle_number)}</p>
                </div>
            </div>

            {/* Status */}
            <div className="p-6 border-r border-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Status</p>
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <p className="text-base font-black text-amber-600 leading-none tracking-tight truncate">{trip.status}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 italic">Current state</p>
                </div>
            </div>

            {/* Total Bill */}
            <div className="p-6 bg-emerald-50/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Plus size={22} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1.5">Total Bill</p>
                    <p className="text-base font-black text-emerald-700 leading-none mb-1 tracking-tight truncate">
                        ₹{trip.total_bill_amount || '0.00'}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600/60 italic">Not billed yet</p>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 relative">
          <div className="flex overflow-x-auto border-b border-gray-50 bg-gray-50/30 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-8 py-4 text-xs font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wide
                   ${activeTab === tab.id ? 'border-[#0052CC] text-[#0052CC] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}>
                <tab.icon size={13} strokeWidth={2.5} />
                {tab.label}
                {tab.count !== undefined && <span className={`ml-1 text-[9px] px-2 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-[#0052CC] text-white shadow-md shadow-blue-100' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="p-8 lg:p-10 bg-gradient-to-b from-white to-gray-50/30 min-h-[500px]">
            {activeTab === 'overview' && (
              <OverviewTab
                trip={trip}
                order={order}
                navigate={navigate}
                originDisplay={originDisplay}
                destinationDisplay={destinationDisplay}
                linkedOrders={linkedOrders}
                stops={sortedStops}
                activeOrderTab={activeOrderTab}
                setActiveOrderTab={setActiveOrderTab}
              />
            )}
            {activeTab === 'journey' && (
                <JourneyTab 
                    trip={trip} 
                    driver={getDriverDisplay(driver, driverId, trip?.primary_driver_name)} 
                    vehicle={getVehicleDisplay(vehicle, vehicleId, trip?.vehicle_number)} 
                    isLoadingNames={loadingDriver || loadingVehicle}
                    altDriver={getDriverDisplay(altDriver, altDriverId, trip?.alternate_driver_name)}
                    altVehicle={getVehicleDisplay(altVehicle, altVehicleId, trip?.alternate_vehicle_number)}
                />
            )}
            {activeTab === 'finance' && <FinanceTab trip={trip} expenses={expenses} charges={charges} isLoadingExp={loadingExp} isLoadingChg={loadingChg} onEditFinance={handleEditFinance} onDeleteFinance={handleDeleteFinance} />}
            {activeTab === 'cargo' && <CargoTab tripId={id} onOpenCreate={() => setIsCreateCargoOpen(true)} />}
            {activeTab === 'stops' && (
              <StopsTab
                tripId={id}
                stops={Array.isArray(stops) ? stops : stops?.results}
                isLoading={loadingStops}
                onCreateStop={(data) => createStopMutation.mutate(data)}
                onUpdateStopStatus={(stopId, stopStatus, extraData = {}) => {
                  const data = stopStatus ? { stop_status: stopStatus, ...extraData } : extraData;
                  updateStopMutation.mutate({ stopId, data });
                }}
                onDeleteStop={(stopId) => {
                  if (window.confirm('Delete this stop?')) deleteStopMutation.mutate(stopId)
                }}
              />
            )}
            {activeTab === 'history' && <HistoryTab history={Array.isArray(history) ? history : history?.results} isLoading={loadingHistory} />}
            {activeTab === 'deliveries' && (
              <DeliveriesTab
                tripId={id}
                deliveries={Array.isArray(tripDeliveries) ? tripDeliveries : tripDeliveries?.results}
                stops={sortedStops}
                isCreating={createPODMutation.isPending}
                createDelivery={(payload) => createPODMutation.mutate(payload)}
              />
            )}
            {activeTab === 'docs' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Clock size={32} className="opacity-20 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">In Development</p>
                <p className="text-[10px] uppercase tracking-wider mt-2">Document Management System Coming Soon</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {trip && (
        <EditTripModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          trip={trip}
        />
      )}
      <EditFinanceModal
        isOpen={!!editFinanceItem}
        onClose={closeEditFinanceModal}
        value={editFinanceForm}
        onChange={setEditFinanceForm}
        onSubmit={handleSaveFinance}
        isPending={updateExpenseMutation.isPending || updateChargeMutation.isPending}
        title={editFinanceItem?.res_type === 'EXPENSE' ? 'Edit Expense' : 'Edit Charge'}
      />
      <CreateCargoModal
        isOpen={isCreateCargoOpen}
        onClose={() => setIsCreateCargoOpen(false)}
        presetTripId={id}
      />
    </div>
  );
}

