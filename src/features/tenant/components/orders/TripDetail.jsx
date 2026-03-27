import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, MapPin, Calendar,
  Map as MapIcon, ChevronRight, Loader2,
  AlertCircle, Hash, Clock, CheckCircle2,
  User, Shield, FileText, Receipt,
  CreditCard, History, Plus, ArrowRight
} from 'lucide-react';
import {
  useTripDetail, useTripStops, useTripDocuments,
  useTripExpenses, useTripCharges, useTripStatusHistory
} from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { EditTripModal } from './TripModals';

// --- Shared Components ---
const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${className}`}>
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-[#0052CC]" />
      <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wider">{title}</h3>
    </div>
    {action}
  </div>
);

const InfoCard = ({ label, value, icon: Icon, accent = false }) => (
  <div className={`p-4 rounded-xl border transition-all ${accent ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className={`text-sm font-bold truncate ${accent ? 'text-blue-700' : 'text-[#172B4D]'}`}>{value || '—'}</p>
      </div>
    </div>
  </div>
);

// --- Tabs ---
const OverviewTab = ({ trip, driver, vehicle }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <InfoCard label="Status" value={trip.status} icon={Clock} accent />
      <InfoCard label="Origin" value={trip.origin} icon={MapPin} />
      <InfoCard label="Destination" value={trip.destination} icon={MapPin} />
      <InfoCard label="Trip Number" value={trip.trip_number} icon={Hash} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={Truck} title="Fleet & Assignment" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="Primary Driver" value={driver} icon={User} />
          <InfoCard label="Vehicle" value={vehicle} icon={Truck} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={Calendar} title="Schedule & Timing" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="Start Time" value={trip.start_time ? new Date(trip.start_time).toLocaleString() : 'Not Started'} icon={Clock} />
          <InfoCard label="End Time" value={trip.end_time ? new Date(trip.end_time).toLocaleString() : 'In Progress'} icon={CheckCircle2} />
        </div>
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

const FinanceTab = ({ expenses, charges, isLoadingExp, isLoadingChg }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="space-y-4">
      <SectionHeader icon={Receipt} title="Trip Expenses" />
      <div className="space-y-3">
        {expenses?.map(exp => (
          <div key={exp.id} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs font-black text-[#172B4D] uppercase">{exp.expense_type}</p>
              <p className="text-[10px] text-gray-400 font-bold">{new Date(exp.expense_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-amber-600">{exp.currency} {exp.amount}</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase italic leading-none">{exp.approval_status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <SectionHeader icon={CreditCard} title="Billing Charges" />
      <div className="space-y-3">
        {charges?.map(chg => (
          <div key={chg.id} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs font-black text-[#172B4D] uppercase">{chg.charge_type}</p>
              <p className="text-[10px] text-gray-400 font-bold">{chg.remarks || 'Standard Charge'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-green-600">{chg.currency} {chg.amount}</p>
              {chg.is_taxable && <span className="text-[9px] font-bold text-gray-400 uppercase italic leading-none">+ TAX</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Main COMPONENT ---
export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: trip, isLoading, isError, error } = useTripDetail(id);
  const { data: stops, isLoading: loadingStops } = useTripStops(id);
  const { data: history } = useTripStatusHistory(id);
  const { data: docs } = useTripDocuments(id);
  const { data: expenses, isLoading: loadingExp } = useTripExpenses(id);
  const { data: charges, isLoading: loadingChg } = useTripCharges(id);

  const { data: driversData } = useDrivers({ page_size: 100 });
  const { data: vehiclesData } = useVehicles({ page_size: 100 });

  const getDriver = (id) => {
    const d = driversData?.results?.find(dr => dr.id === id);
    return d ? `${d.user?.first_name} ${d.user?.last_name}` : id?.slice(-6);
  };
  const getVehicle = (id) => {
    const v = vehiclesData?.results?.find(vh => vh.id === id);
    return v ? v.registration_number : id?.slice(-6);
  };

  const handleBack = () => navigate('/tenant/dashboard/orders/trips');

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
    { id: 'stops', label: 'Stops', icon: MapPin, count: stops?.length },
    { id: 'finance', label: 'Finances', icon: Receipt },
    { id: 'docs', label: 'Documents', icon: FileText, count: docs?.length },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full space-y-6">

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={handleBack} className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline transition-all">
            <ArrowLeft size={14} /> Trips
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{trip.trip_number || trip.id.slice(-8)}</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">


            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex items-start justify-between gap-4 text-left">
                <div>
                  <h1 className="text-2xl font-black text-[#172B4D] flex items-center gap-3">
                    {trip.origin} <ArrowRight size={20} className="inline mx-2 text-gray-300" /> {trip.destination}
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200 uppercase tracking-wider">{trip.trip_number || trip.id.slice(-8)}</span>
                  </h1>
                  <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    Created {new Date(trip.created_at).toLocaleDateString()} · ID: {trip.id.slice(-12)}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className={`${st.bg} ${st.color} border-current/20`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {trip.status}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                      <Truck size={10} />
                      {trip.trip_type || 'FTL'}
                    </Badge>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 text-sm font-black text-white bg-[#0052CC] rounded-xl hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all"
                  >
                    Edit Trip
                  </button>
                  <button className="px-4 py-2 text-sm font-black text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-md shadow-amber-100 transition-all">Update Status</button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-xl border border-gray-100 transition-all"><Plus size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <InfoCard label="Driver" value={getDriver(trip.primary_driver_id || trip.driver_id)} icon={User} />
                <InfoCard label="Vehicle" value={getVehicle(trip.primary_vehicle_id || trip.vehicle_id)} icon={Truck} />
                <InfoCard label="Avg Duration" value="2d 4h" icon={Clock} />
                <InfoCard label="Kilometers" value="450 km" icon={MapIcon} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-black border-b-2 transition-all shrink-0
                   ${activeTab === tab.id ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/50' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                <tab.icon size={14} />
                {tab.label}
                {tab.count !== undefined && <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-400'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="p-4 bg-gray-50/30 min-h-[400px]">
            {activeTab === 'overview' && <OverviewTab trip={trip} driver={getDriver(trip.primary_driver_id || trip.driver_id)} vehicle={getVehicle(trip.primary_vehicle_id || trip.vehicle_id)} />}
            {activeTab === 'stops' && <StopsTab stops={stops} isLoading={loadingStops} />}
            {activeTab === 'finance' && <FinanceTab expenses={expenses} charges={charges} isLoadingExp={loadingExp} isLoadingChg={loadingChg} />}
            {activeTab === 'docs' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Clock size={32} className="opacity-20 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">In Development</p>
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
