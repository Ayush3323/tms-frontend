import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Truck, FileText, History,
  Package, Calendar, User, IndianRupee,
  ChevronRight, Loader2, AlertCircle,
  Hash, Clock, CheckCircle2, XCircle, MapPin
} from 'lucide-react';
import { useOrderDetail, useUpdateOrder, useCancelOrder, useTrips } from '../../queries/orders/ordersQuery';
import { useCustomers } from '../../queries/customers/customersQuery';
import { EditOrderModal } from './OrderModals';

// --- Components & Helpers ---
const STATUS_CONFIG = {
  DRAFT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-600' },
  CONFIRMED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', dot: 'bg-green-600' },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-600' },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-600' },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', dot: 'bg-teal-600' },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-600' },
};

const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${className}`}>
    {children}
  </span>
);

const InfoCard = ({ label, value, icon: Icon, accent = false }) => (
  <div className={`p-4 rounded-xl border transition-all ${accent ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className={`text-sm font-bold truncate ${accent ? 'text-blue-700' : 'text-[#172B4D]'}`}>{value || '—'}</p>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={18} className="text-[#0052CC]" />
    <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wider">{title}</h3>
  </div>
);

const TABS = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'cargo', label: 'Cargo Items', icon: Package },
  { id: 'trips', label: 'Trips', icon: Truck },
  { id: 'documents', label: 'Documents', icon: FileText },
];


// --- Sub-sections ---

const OverviewTab = ({ order, getCustomerName }) => (
  <div className="space-y-6">
    {/* Key Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Status', value: order.status, icon: Clock, accent: true },
        { label: 'Order Type', value: order.order_type, icon: Truck },
        { label: 'Pickup Date', value: order.pickup_date, icon: Calendar },
        { label: 'Delivery Date', value: order.delivery_date, icon: Calendar },
      ].map((stat, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
          <div className="flex items-center gap-2">
            <stat.icon size={14} className={stat.accent ? "text-blue-600" : "text-gray-400"} />
            <span className="text-sm font-black text-[#172B4D]">{stat.value || '—'}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Route Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={MapPin} title="Route & Participants" />
        <div className="space-y-4">
          <div className="relative pl-8 pb-4 border-l-2 border-dashed border-gray-100 last:border-0 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Consigner (From)</p>
            <p className="text-sm font-bold text-[#172B4D]">{getCustomerName(order.consigner_id)}</p>
          </div>
          <div className="relative pl-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Consignee (To)</p>
            <p className="text-sm font-bold text-[#172B4D]">{getCustomerName(order.consignee_id)}</p>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader icon={Hash} title="Billing & Reference" />
        <div className="grid grid-cols-2 gap-4">
          <InfoCard label="Billing Customer" value={getCustomerName(order.billing_customer_id)} icon={User} />
          <InfoCard label="Reference #" value={order.reference_number} icon={Hash} />
        </div>
        <div className="mt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes</p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                {order.notes || "No special instructions provided."}
            </div>
        </div>
      </div>
    </div>
  </div>
);

const TripsTab = ({ orderId, navigate }) => {
  const { data: tripsData, isLoading } = useTrips({ order_id: orderId });
  const trips = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading trips...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-[#172B4D]">Associated Transport Legs</h3>
        <button 
          onClick={() => navigate(`/tenant/dashboard/orders/${orderId}/trips`)}
          className="text-xs font-black text-[#0052CC] uppercase tracking-widest flex items-center gap-1 hover:underline"
        >
          Manage All <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.length > 0 ? (
          trips.slice(0, 4).map(trip => (
            <div 
              key={trip.id} 
              onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)}
              className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-blue-100 transition-all shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Truck size={16} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#172B4D]">{trip.trip_number}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{trip.status}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 bg-white rounded-2xl border border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
             <Truck size={24} className="opacity-20 mb-2" />
             <p className="text-xs font-bold uppercase tracking-widest">No trips linked yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(id);
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const getCustomerName = (id) => {
    if (!id) return '-';
    const c = customers.find(cust => cust.id === id);
    if (!c) return 'Unknown';
    return c.legal_name || c.trading_name || c.customer_code || id.slice(-6);
  };

  const handleBack = () => navigate('/tenant/dashboard/orders');

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
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <button onClick={handleBack} className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
            <ArrowLeft size={14} /> Orders
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{order.lr_number}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Visual ID Badge */}


            {/* Info and Actions */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-[#172B4D] flex items-center gap-3">
                    {getCustomerName(order.billing_customer_id)}
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200 uppercase tracking-wider">{order.lr_number}</span>
                  </h1>
                  <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    Ref: {order.reference_number || 'N/A'} · Created {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className={`${st.bg} ${st.color} ${st.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {order.status}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                      <Truck size={10} />
                      {order.order_type}
                    </Badge>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-md shadow-blue-100"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all">
                    <XCircle size={14} /> Cancel
                  </button>
                </div>
              </div>

              {/* Mini Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: "Origin", value: getCustomerName(order.consigner_id) },
                  { label: "Destination", value: getCustomerName(order.consignee_id) },
                  { label: "Pickup", value: order.pickup_date || '-' },
                  { label: "Delivery", value: order.delivery_date || '-' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xs font-bold text-[#172B4D] truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
           <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
             {TABS.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 transition-all shrink-0
                   ${activeTab === tab.id 
                     ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/50' 
                     : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
               >
                 <tab.icon size={14} />
                 {tab.label}
               </button>
             ))}
           </div>
           
            <div className="p-4 bg-gray-50/30 min-h-[400px]">
               {activeTab === 'overview' && <OverviewTab order={order} getCustomerName={getCustomerName} />}
               {activeTab === 'trips' && <TripsTab orderId={id} navigate={navigate} />}
               {activeTab === 'cargo' && (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                     <Package size={32} className="opacity-20" />
                   </div>
                   <p className="text-sm font-medium">Cargo Items Coming Soon</p>
                 </div>
               )}
               {activeTab === 'documents' && (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
                     <FileText size={32} className="opacity-20" />
                   </div>
                   <p className="text-sm font-medium">Documents Coming Soon</p>
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
    </div>
  );
}
