import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, MapPin, Calendar,
  Map as MapIcon, ChevronRight, Loader2,
  AlertCircle, Hash, Clock, CheckCircle2,
  User, Shield, FileText, Receipt, Edit3,
  CreditCard, History, Plus, ArrowRight,
  Gauge, Zap, DollarSign, Activity, Package as PackageIcon, Trash2
} from 'lucide-react';
import {
  useTripDetail, useTripStops, useTripDocuments,
  useTripExpenses, useTripCharges, useTripStatusHistory,
  useOrderDetail, useDeleteTrip
} from '../../queries/orders/ordersQuery';
import { useDriverDetail } from '../../queries/drivers/driverCoreQuery';
import { useVehicle } from '../../queries/vehicles/vehicleQuery';
import { EditTripModal } from './TripModals';
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

const InfoCard = ({ label, value, icon: Icon, accent = false, isLoading = false }) => (
  <div className={`p-4 rounded-2xl border transition-all ${
    accent 
      ? 'bg-blue-50/50 border-blue-100' 
      : 'bg-white border-gray-100 shadow-sm'
  }`}>
    <div className="flex items-center gap-4">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-50 text-gray-400'
        }`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">
          {label}
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

// --- Tabs ---
const OverviewTab = ({ trip, driver, vehicle, order, isLoadingNames }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InfoCard label="status" value={trip.status} icon={Clock} accent />
      <InfoCard label="trip_number" value={trip.trip_number} icon={Hash} />
      <InfoCard label="lr_number" value={trip.lr_number} icon={FileText} />
      <InfoCard label="trip_type" value={trip.trip_type} icon={Truck} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={MapPin} title="Route Summary" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="origin_address" value={trip.origin_address || trip.origin} icon={MapPin} />
          <InfoCard label="destination_address" value={trip.destination_address || trip.destination} icon={MapPin} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={Calendar} title="Reference Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="reference_number" value={trip.reference_number} icon={Hash} />
          <InfoCard label="created_date" value={trip.created_date} icon={Calendar} />
        </div>
      </div>
    </div>

    {trip.remarks && (
        <div className="bg-amber-50/20 rounded-2xl border border-amber-100 p-6 shadow-sm">
            <SectionHeader icon={FileText} title="Trip Remarks" />
            <p className="text-sm text-gray-600 font-medium italic">"{trip.remarks}"</p>
        </div>
    )}

    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
      <SectionHeader icon={Shield} title="Technical Audit Information" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label="version" value={trip.version} icon={Hash} />
        <InfoCard label="created_at" value={new Date(trip.created_at).toLocaleString()} icon={Clock} />
        <InfoCard label="updated_at" value={new Date(trip.updated_at).toLocaleString()} icon={Clock} />
      </div>
    </div>
  </div>
);

const JourneyTab = ({ trip, driver, vehicle, isLoadingNames, altDriver, altVehicle }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={User} title="Fleet & Crew Allocation" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard label="primary_driver_id" value={driver} icon={User} isLoading={isLoadingNames} accent />
          <InfoCard label="primary_vehicle_id" value={vehicle} icon={Truck} isLoading={isLoadingNames} accent />
          <InfoCard label="vehicle_owner_name" value={trip.vehicle_owner_name} icon={User} />
          <InfoCard label="vehicle_type_code" value={trip.vehicle_type_code} icon={Truck} />
          <InfoCard label="alternate_driver_id" value={altDriver} icon={User} />
          <InfoCard label="alternate_vehicle_id" value={altVehicle} icon={Truck} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={Clock} title="Schedule & Timing" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="scheduled_pickup_date" value={trip.scheduled_pickup_date} icon={Calendar} />
          <InfoCard label="scheduled_delivery_date" value={trip.scheduled_delivery_date} icon={CheckCircle2} />
          <InfoCard label="actual_pickup_date" value={trip.actual_pickup_date} icon={Clock} />
          <InfoCard label="actual_delivery_date" value={trip.actual_delivery_date} icon={CheckCircle2} />
          <InfoCard label="start_time" value={trip.start_time} icon={Zap} />
          <InfoCard label="end_time" value={trip.end_time} icon={Zap} />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <SectionHeader icon={Gauge} title="Performance & Fuel Metrics" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <InfoCard label="total_distance_km" value={trip.total_distance_km ? `${trip.total_distance_km} KM` : '—'} icon={MapIcon} accent />
        <InfoCard label="start_odometer_km" value={trip.start_odometer_km ? `${trip.start_odometer_km} KM` : '—'} icon={Gauge} />
        <InfoCard label="end_odometer_km" value={trip.end_odometer_km ? `${trip.end_odometer_km} KM` : '—'} icon={Gauge} />
        <InfoCard label="estimated_fuel_liters" value={trip.estimated_fuel_liters ? `${trip.estimated_fuel_liters} L` : '—'} icon={Zap} />
        <InfoCard label="actual_fuel_liters" value={trip.actual_fuel_liters ? `${trip.actual_fuel_liters} L` : '—'} icon={Zap} />
        <InfoCard label="fuel_rate_per_liter" value={trip.fuel_rate_per_liter ? `${trip.fuel_rate_per_liter} / L` : '—'} icon={DollarSign} />
      </div>
    </div>
  </div>
);

const StopsTab = ({ stops, isLoading }) => (
  <div className="space-y-4">
    <SectionHeader icon={MapPin} title="Trip Sequence" />
    {isLoading ? (
      <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
    ) : stops?.length > 0 ? (
      <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
        {stops.map((stop, i) => (
          <div key={stop.id} className="relative">
            <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${stop.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} />
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stop #{stop.sequence_order} • {stop.stop_type}</span>
                <Badge className={stop.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}>{stop.status}</Badge>
              </div>
              <p className="text-sm font-black text-[#172B4D]">{stop.location_name}</p>
              <p className="text-xs text-gray-500 font-medium">{stop.city}, {stop.state}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">No stops recorded for this trip.</p>
      </div>
    )}
  </div>
);

const FinanceTab = ({ trip, expenses, charges, isLoadingExp, isLoadingChg }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="total_bill_amount" value={`${trip.total_bill_amount || '0.00'} INR`} icon={DollarSign} accent />
        <InfoCard label="total_freight_charge" value={`${trip.total_freight_charge} INR`} icon={Receipt} />
        <InfoCard label="total_accessorial_charge" value={`${trip.total_accessorial_charge} INR`} icon={Plus} />
        <InfoCard label="total_tax" value={`${trip.total_tax} INR`} icon={Shield} />
        <InfoCard label="is_paid" value={trip.is_paid ? 'True' : 'False'} icon={Shield} accent={trip.is_paid} />
        <InfoCard label="is_billed" value={trip.is_billed ? 'True' : 'False'} icon={FileText} accent={trip.is_billed} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={CreditCard} title="Commissions & Deductibles" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard label="broker_commission" value={`${trip.broker_commission || '0.00'} INR`} icon={DollarSign} />
          <InfoCard label="booked_price" value={`${trip.booked_price || '0.00'} INR`} icon={DollarSign} />
          <InfoCard label="part_load_charge" value={`${trip.part_load_charge || '0.00'} INR`} icon={PackageIcon} />
          <InfoCard label="tds_percentage" value={`${trip.tds_percentage || '0.00'} %`} icon={Activity} />
          <InfoCard label="tds_amount" value={`${trip.tds_amount || '0.00'} INR`} icon={DollarSign} />
          <InfoCard label="late_fee" value={`${trip.late_fee || '0.00'} INR`} icon={AlertCircle} />
          <InfoCard label="damage_amount" value={`${trip.damage_amount || '0.00'} INR (${trip.damage_count || 0} items)`} icon={AlertCircle} />
          <InfoCard label="incentive_amount" value={`${trip.incentive_amount || '0.00'} INR`} icon={Plus} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={Clock} title="Payment Settlement" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="payment_received_amount" value={`${trip.payment_received_amount || '0.00'} INR`} icon={DollarSign} accent />
          <InfoCard label="payment_received_date" value={trip.payment_received_date} icon={Calendar} />
          <InfoCard label="pod_received_date" value={trip.pod_received_date} icon={FileText} />
          <InfoCard label="pod_turnaround_days" value={`${trip.pod_turnaround_days || '—'} Days`} icon={Clock} />
        </div>
      </div>
    </div>
  </div>
);

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
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  const driverId = trip?.primary_driver_id || trip?.driver_id;
  const vehicleId = trip?.primary_vehicle_id || trip?.vehicle_id;
  const altDriverId = trip?.alternate_driver_id;
  const altVehicleId = trip?.alternate_vehicle_id;

  const { data: driver, isLoading: loadingDriver } = useDriverDetail(driverId);
  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(vehicleId);
  const { data: altDriver } = useDriverDetail(altDriverId);
  const { data: altVehicle } = useVehicle(altVehicleId);

  const getDriverDisplay = (d, id, fallback) => {
    if (!id) return fallback || 'Unassigned';
    return d ? `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim() : (fallback || 'Unassigned');
  };

  const getVehicleDisplay = (v, id, fallback) => {
    if (!id) return fallback || 'Unassigned';
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
    STARTED: { bg: 'bg-amber-50', color: 'text-amber-600', dot: 'bg-amber-600' },
    IN_TRANSIT: { bg: 'bg-indigo-50', color: 'text-indigo-600', dot: 'bg-indigo-600' },
    COMPLETED: { bg: 'bg-green-50', color: 'text-green-600', dot: 'bg-green-600' },
  };
  const st = statusMap[trip.status] || statusMap.CREATED;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: MapIcon },
    { id: 'journey', label: 'Journey & Fleet', icon: Truck },
    { id: 'finance', label: 'Financials', icon: Receipt },
    { id: 'stops', label: 'Stops', icon: MapPin, count: (Array.isArray(stops) ? stops : stops?.results)?.length },
    { id: 'history', label: 'Status History', icon: History, count: (Array.isArray(history) ? history : history?.results)?.length },
    { id: 'docs', label: 'Documents', icon: FileText, count: docs?.length },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 font-sans">
      <div className="w-full space-y-6">

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4">
          <button onClick={handleBack} className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">Trips</button>
          <ChevronRight size={10} className="text-gray-300" strokeWidth={3} />
          <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 cursor-default">{trip.trip_number}</span>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100/80 overflow-hidden shadow-2xl shadow-gray-200/40">
          <div className="p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 flex items-center justify-between max-w-2xl">
              {/* Origin */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Origin</p>
                <h1 className="text-4xl font-black text-[#172B4D] tracking-tighter">{trip.origin_address || trip.origin || 'Delhi'}</h1>
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
                <h1 className="text-4xl font-black text-[#172B4D] tracking-tighter">{trip.destination_address || trip.destination || 'Mumbai'}</h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => setIsEditOpen(true)} 
                className="flex items-center gap-2.5 px-6 py-3 bg-[#4a6cf7] border border-[#4a6cf7] rounded-xl text-xs font-black text-white hover:bg-[#3b59d9] hover:border-[#3b59d9] cursor-pointer transition-all shadow-lg shadow-blue-200/50 uppercase tracking-widest">
                <Edit3 size={14} strokeWidth={2.5} /> Edit trip
              </button>
              <button onClick={handleDelete} 
                disabled={deleteTripMutation.isLoading}
                className="flex items-center gap-2.5 px-6 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-black text-red-600 hover:bg-red-100 cursor-pointer transition-all uppercase tracking-widest">
                <Trash2 size={14} strokeWidth={2.5} /> {deleteTripMutation.isLoading ? 'Deleting...' : 'Delete trip'}
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="px-8 pb-8 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  {trip.status}
              </div>
              <div className="px-3 py-1.5 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                  {trip.trip_type || 'FTL'}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500">
                  <Hash size={10} className="text-gray-200" />
                  {order?.lr_number || trip.lr_number || 'LR-PENDING'}
              </div>
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
                className={`flex items-center gap-2.5 px-10 py-5 text-[10px] font-black border-b-2 transition-all shrink-0 uppercase tracking-[0.15em]
                   ${activeTab === tab.id ? 'border-[#0052CC] text-[#0052CC] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}>
                <tab.icon size={13} strokeWidth={2.5} />
                {tab.label}
                {tab.count !== undefined && <span className={`ml-1 text-[9px] px-2 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-[#0052CC] text-white shadow-md shadow-blue-100' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="p-8 lg:p-10 bg-gradient-to-b from-white to-gray-50/30 min-h-[500px]">
            {activeTab === 'overview' && <OverviewTab trip={trip} driver={getDriverDisplay(driver, driverId, trip?.primary_driver_name)} vehicle={getVehicleDisplay(vehicle, vehicleId, trip?.vehicle_number)} order={order} isLoadingNames={loadingDriver || loadingVehicle} />}
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
            {activeTab === 'finance' && <FinanceTab trip={trip} expenses={expenses} charges={charges} isLoadingExp={loadingExp} isLoadingChg={loadingChg} />}
            {activeTab === 'stops' && <StopsTab stops={Array.isArray(stops) ? stops : stops?.results} isLoading={loadingStops} />}
            {activeTab === 'history' && <HistoryTab history={Array.isArray(history) ? history : history?.results} isLoading={loadingHistory} />}
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
    </div>
  );
}

