import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Truck, FileText, History,
  Package, Calendar, User, IndianRupee,
  ChevronRight, Loader2, AlertCircle,
  Hash, Clock, CheckCircle2, XCircle, MapPin,
  ShieldCheck, UserCircle, RefreshCcw, Trash2
} from 'lucide-react';
import { 
  useOrderDetail, 
  useUpdateOrder, 
  useDeleteOrder, 
  useTrips,
  useCargoItems,
  useAssignTrip,
  useCancelOrder
} from '../../queries/orders/ordersQuery';
import { useCustomer } from '../../queries/customers/customersQuery';
import { EditOrderModal, AssignTripModal } from './OrderModals';

// --- Configuration & Helpers ---
const STATUS_STEPS = [
  { id: 'DRAFT', label: 'Draft', icon: Clock },
  { id: 'CONFIRMED', label: 'Confirmed', icon: ShieldCheck },
  { id: 'ASSIGNED', label: 'Assigned', icon: Truck },
  { id: 'IN_TRANSIT', label: 'In Transit', icon: Package },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  DRAFT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-600' },
  CONFIRMED: { color: 'text-[#0052CC]', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-[#0052CC]' },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-600' },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-600' },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', dot: 'bg-teal-600' },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-600' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'cargo', label: 'Cargo Items', icon: Package },
  { id: 'trips', label: 'Trips', icon: Truck },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${className}`}>
    {children}
  </span>
);

const DataField = ({ label, value, mono = false, accent = false }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-black text-[#172B4D] ${mono ? 'font-mono' : ''} truncate`}>
      {value || '---'}
    </span>
  </div>
);

const Section = ({ title, children, icon: Icon }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-[#0052CC]" />}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const StatusStepper = ({ currentStatus }) => {
  const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 shadow-sm">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle size={20} />
          <span className="font-black uppercase tracking-widest text-xs">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full max-w-4xl mx-auto mb-10 px-4">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === STATUS_STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 
                ${isCompleted || isActive ? 'bg-[#0052CC] border-[#0052CC] text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-200 text-gray-400'}`}>
                {isCompleted ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest mt-2 absolute -bottom-6 w-24 text-center
                ${isActive ? 'text-[#0052CC]' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-[2px] mx-2 bg-gray-100 relative overflow-hidden">
                <div className={`absolute inset-0 bg-[#0052CC] transition-all duration-700 
                  ${isCompleted ? 'translate-x-0' : '-translate-x-full'}`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OverviewTab = ({ order, getCustomerName, st, consignor, consignee, billingCustomer }) => (
  <div className="space-y-6">
    {/* Grid with Identity and Timeline */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Shipment Identity" icon={Package}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <DataField label="Order Number" value={order.lr_number} mono />
                <DataField label="Order Type" value={order.order_type} accent />
                <DataField label="Current Status" value={order.status} />
                <DataField label="Version" value={`v${order.version || 1}.0`} />
            </div>
        </Section>

        <Section title="Shipment Timeline" icon={Calendar}>
            <div className="grid grid-cols-2 gap-5">
                <DataField label="Pickup Date" value={order.pickup_date || 'Not Set'} />
                <DataField label="Delivery Date" value={order.delivery_date || 'Not Set'} />
            </div>
        </Section>
    </div>

    {/* Participants Details */}
    <Section title="Participants" icon={User}>
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            {/* Consignor (Sender) */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-blue-100 bg-blue-50/20">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none">Consignor (sender)</p>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm border border-blue-200">
                        SENDER
                    </span>
                </div>
                <h4 className="text-base font-black text-[#172B4D] leading-tight mb-2">
                    {consignor?.legal_name || consignor?.name || order.consignor_id || 'Unassigned'}
                </h4>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    {consignor?.customer_code || 'NOT SET'}
                </p>
            </div>

            {/* Relationship Indicator */}
            <div className="lg:col-span-1 flex lg:flex-col items-center justify-center gap-2 py-2">
                <div className="h-[1px] lg:h-10 w-full lg:w-[1px] bg-gray-200" />
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest italic whitespace-nowrap">ships to</span>
                <div className="h-[1px] lg:h-10 w-full lg:w-[1px] bg-gray-200" />
            </div>

            {/* Consignee (Receiver) */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-green-100 bg-green-50/20">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none">Consignee (receiver)</p>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest shadow-sm border border-green-200">
                        RECEIVER
                    </span>
                </div>
                <h4 className="text-base font-black text-[#172B4D] leading-tight mb-2">
                    {consignee?.legal_name || consignee?.name || order.consignee_id || 'Unassigned'}
                </h4>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                    {consignee?.customer_code || 'NOT SET'}
                </p>
            </div>
        </div>
    </Section>

    {/* Billing & Reference Details */}
    <Section title="Billing & Reference" icon={Hash}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Billing Customer</span>
                <span className="text-sm font-black text-[#172B4D] truncate">
                    {billingCustomer?.legal_name || billingCustomer?.name || getCustomerName(order.billing_customer_id)}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{billingCustomer?.customer_code}</span>
            </div>
            <DataField label="Customer Reference Number" value={order.reference_number} mono />
            <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Internal Notes</p>
                <p className="text-xs text-gray-600 italic line-clamp-2">
                    {order.notes || "No special instructions provided for this shipment."}
                </p>
            </div>
        </div>
    </Section>

    {/* System Audit Details */}
    <Section title="System Audit" icon={History}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 items-center">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 shrink-0">
                    <User size={12} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Created By</p>
                    <p className="text-xs font-semibold text-[#172B4D] truncate" title={order.created_by}>
                        {order.created_by?.slice(0, 10)}...
                    </p>
                </div>
            </div>
            <DataField label="Created On" value={new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} />
            <DataField label="Created Time" value={new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
            <DataField label="Last Updated" value={new Date(order.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} />
            <DataField label="Version" value={`v${order.version || 1}.0`} />
        </div>
    </Section>
  </div>
);

const TripsTab = ({ orderId, navigate }) => {
  const { data: tripsData, isLoading } = useTrips({ order_id: orderId });
  const trips = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);

  // Sort trips chronologically by pickup_date, scheduled_date or created_at
  const sortedTrips = [...trips].sort((a, b) => {
    const dateA = new Date(a.pickup_date || a.scheduled_date || a.created_at);
    const dateB = new Date(b.pickup_date || b.scheduled_date || b.created_at);
    return dateA - dateB;
  });

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-[#0052CC]" /> Loading trips...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#172B4D]">Associated Transport Legs</h3>
        <button 
          onClick={() => {
            if (trips.length > 0) {
              navigate(`/tenant/dashboard/orders/trips/${trips[0].id}`);
            } else {
              toast.info("No trips assigned to this order yet.");
            }
          }}
          className="text-xs font-bold text-[#0052CC] flex items-center gap-1 hover:underline transition-all group"
        >
          Manage All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedTrips.length > 0 ? (
          sortedTrips.map(trip => {
            const isActive = trip.status === 'IN_TRANSIT';
            const isAssigned = trip.status === 'ASSIGNED' || trip.status === 'SCHEDULED';
            const isRecent = (new Date() - new Date(trip.updated_at || trip.created_at || Date.now())) < 120000; // 2 minutes

            return (
              <div 
                key={trip.id} 
                onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)}
                className={`bg-white border rounded-xl p-4 flex items-center justify-between group cursor-pointer transition-all shadow-sm ${
                    isActive ? 'border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-50' : 
                    isAssigned ? 'border-amber-200 bg-amber-50/20' :
                    'border-gray-100 hover:border-[#0052CC]/30 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg transition-colors ${
                      isActive ? 'bg-indigo-600 text-white shadow-sm' : 
                      isAssigned ? 'bg-amber-500 text-white shadow-sm' :
                      'bg-blue-50 text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white'
                  }`}>
                    <Truck size={18} />
                  </div>
                  <div>
                      <div className="flex items-center gap-2 mb-1 leading-none">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip ID</p>
                        {isActive && (
                            <div className="flex items-center gap-1.5 ml-1">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Current Leg</span>
                            </div>
                        )}
                        {isAssigned && !isActive && (
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1">Next Leg</span>
                        )}
                        {isRecent && (
                            <span className="ml-2 animate-bounce px-1.5 py-0.5 rounded-sm bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-tighter">New!</span>
                        )}
                      </div>
                      <p className={`text-sm font-black transition-colors ${
                          isActive ? 'text-indigo-700' : 
                          isAssigned ? 'text-amber-700' :
                          'text-[#172B4D] group-hover:text-[#0052CC]'
                      }`}>
                        {trip.trip_number || 'TRP-NEW'}
                      </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 
                        isAssigned ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        trip.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {trip.status || 'UNASSIGNED'}
                    </span>
                    <ChevronRight size={16} className={`transition-all ${
                        isActive ? 'text-indigo-400 group-hover:text-indigo-600' : 
                        isAssigned ? 'text-amber-400 group-hover:text-amber-600' :
                        'text-gray-300 group-hover:text-[#0052CC]'
                    } group-hover:translate-x-1`} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
             <div className="p-4 bg-gray-50 rounded-full mb-4">
               <Truck size={32} className="opacity-20" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest">No Trips Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CargoTab = ({ orderId, navigate }) => {
  const { data: tripsData, isLoading: loadingTrips } = useTrips({ order_id: orderId, page_size: 200 });
  const { data: cargoData, isLoading: loadingCargo } = useCargoItems({ page_size: 500 });
  const trips = tripsData?.results || [];
  const cargoItems = cargoData?.results || [];
  const tripIds = new Set(trips.map((t) => String(t.id)));
  const filteredCargo = cargoItems.filter((c) => tripIds.has(String(c.trip)));

  if (loadingTrips || loadingCargo) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-[#0052CC]" /> Loading cargo...</div>;
  }

  if (!filteredCargo.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
        <div className="p-6 bg-white rounded-full border border-gray-100 shadow-sm mb-4">
          <Package size={48} className="opacity-10" />
        </div>
        <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">No Cargo Items Linked</h3>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredCargo.map((item) => (
        <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#172B4D]">{item.description || 'Cargo Item'}</p>
            <p className="text-xs text-gray-500 uppercase">{item.item_code || item.id?.slice(-8)} • {item.status || 'PENDING'}</p>
          </div>
          <button
            onClick={() => navigate(`/tenant/dashboard/orders/cargo/${item.id}`)}
            className="text-xs font-bold text-[#0052CC] hover:underline"
          >
            Open Cargo
          </button>
        </div>
      ))}
    </div>
  );
};

// --- Main Component ---

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

   const { data: order, isLoading, isError, error } = useOrderDetail(id);
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();
  const cancelOrderMutation = useCancelOrder();

  // Fetch expanded customer data if not present in order object
  const { data: consignor } = useCustomer(typeof order?.consignor_id === 'string' ? order.consignor_id : null);
  const { data: consignee } = useCustomer(typeof order?.consignee_id === 'string' ? order.consignee_id : null);
  const { data: billingCustomer } = useCustomer(typeof order?.billing_customer_id === 'string' ? order.billing_customer_id : null);

  const getCustomerName = (customerId) => {
    if (!customerId) return 'Unassigned';
    if (typeof customerId === 'string') return customerId.slice(-8).toUpperCase();
    return customerId.trading_name || customerId.legal_name || customerId.name || customerId.id?.slice(-8).toUpperCase() || 'Unknown';
  };

  const handleBack = () => navigate('/tenant/dashboard/orders');

  const handleConfirm = () => {
    if (window.confirm("Move this order to CONFIRMED status?")) {
        updateOrderMutation.mutate({ 
            id: order.id, 
            data: { status: 'CONFIRMED' } 
        });
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to permanently delete this order? This action cannot be undone.")) {
        deleteOrderMutation.mutate(order.id, {
            onSuccess: () => navigate('/tenant/dashboard/orders')
        });
    }
  };

  const handleCancelClick = () => {
    if (window.confirm("Are you sure you want to cancel this order? This will move it to CANCELLED status.")) {
        cancelOrderMutation.mutate(order.id);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 size={32} className="animate-spin text-[#0052CC]" />
    </div>
  );

  if (isError || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#172B4D]">Failed to load order</h2>
      <p className="text-gray-500 mt-2 mb-6 max-w-xs">{error?.message || "Order detail could not be retrieved."}</p>
      <button onClick={handleBack} className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">
        Go Back
      </button>
    </div>
  );

  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline transition-all group"
                >
                    <ArrowLeft size={16} /> 
                    <span>All Orders</span>
                </button>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="font-semibold text-[#172B4D]">{order.lr_number}</span>
                <Badge className={`${st.bg} ${st.color} ${st.border} px-3 py-1 rounded-full text-[9px] ml-2`}>
                    <div className={`w-1 h-1 rounded-full ${st.dot} animate-pulse`} />
                    {order.status}
                </Badge>
            </div>

            <div className="flex items-center gap-3">
                {order.status === 'DRAFT' && (
                    <button 
                        onClick={handleConfirm}
                        disabled={updateOrderMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
                    >
                        <CheckCircle2 size={16} /> Confirm Order
                    </button>
                )}

                {order.status === 'CONFIRMED' && (
                    <button 
                        onClick={() => setIsAssignOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0052CC] rounded-xl hover:bg-[#0041a3] transition-all shadow-md shadow-blue-100"
                    >
                        <Truck size={16} /> Assign Trip
                    </button>
                )}

                {order.status === 'ASSIGNED' && (
                    <button 
                        onClick={() => {
                            if (window.confirm("Move this order to IN_TRANSIT?")) {
                                updateOrderMutation.mutate({ id: order.id, data: { status: 'IN_TRANSIT' } });
                            }
                        }}
                        disabled={updateOrderMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        <RefreshCcw size={16} /> Mark In-Transit
                    </button>
                )}

                {order.status === 'IN_TRANSIT' && (
                    <button 
                        onClick={() => {
                            if (window.confirm("Mark this order as DELIVERED?")) {
                                updateOrderMutation.mutate({ id: order.id, data: { status: 'DELIVERED' } });
                            }
                        }}
                        disabled={updateOrderMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-100 disabled:opacity-50"
                    >
                        <CheckCircle2 size={16} /> Complete Delivery
                    </button>
                )}

                <button 
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                    <Edit2 size={16} /> Edit
                </button>
                
                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                    <button 
                        onClick={handleCancelClick}
                        disabled={cancelOrderMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
                    >
                        <XCircle size={16} /> Cancel Order
                    </button>
                )}

                {order.status !== 'DELIVERED' && (
                    <button 
                        onClick={handleDeleteClick}
                        disabled={deleteOrderMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                    >
                        <Trash2 size={16} /> Delete Order
                    </button>
                )}
            </div>
        </div>

        {/* Dynamic Status Stepper */}
        <div className="bg-white rounded-3xl border border-gray-200 pt-10 pb-10 shadow-sm overflow-hidden">
            <StatusStepper currentStatus={order.status} />
        </div>

        {/* Main Content Tabs (Full Width) */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide px-4 bg-white">
                {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 shrink-0
                    ${activeTab === tab.id 
                        ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/30' 
                        : 'border-transparent text-gray-400 hover:text-[#172B4D] hover:bg-gray-50'}`}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
                ))}
            </div>
            
            <div className="p-6 lg:p-8 flex-1 bg-gray-50/20">
                {activeTab === 'overview' && (
                    <OverviewTab 
                        order={order} 
                        getCustomerName={getCustomerName} 
                        st={st}
                        consignor={consignor}
                        consignee={consignee}
                        billingCustomer={billingCustomer}
                    />
                )}
                {activeTab === 'trips' && <TripsTab orderId={id} navigate={navigate} />}
                {activeTab === 'cargo' && <CargoTab orderId={id} navigate={navigate} />}
                {activeTab === 'documents' && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                        <div className="p-6 bg-white rounded-full border border-gray-100 shadow-sm mb-4">
                            <FileText size={48} className="opacity-10" />
                        </div>
                        <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Digital Documents</h3>
                        <p className="text-xs mt-1">POD and Invoice storage coming soon.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
      
      {order && (
        <EditOrderModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          order={order} 
        />
      )}

      {order && (
        <AssignTripModal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          order={order}
          consignor={consignor}
          consignee={consignee}
        />
      )}
    </div>
  );
}
