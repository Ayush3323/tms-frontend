import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, Download, Plus, 
  MapPin, User, FileCheck, Image as ImageIcon,
  MoreHorizontal, Eye, Edit2, Trash2, 
  ExternalLink, Calendar, Hash, RefreshCcw, X
} from 'lucide-react';
import { useDeliveries, useCreatePOD } from '../../queries/orders/ordersQuery';

// --- Configuration & Status Badges ---
const POD_STATUS_CONFIG = {
  PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
  SUBMITTED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <FileCheck size={14} /> },
  VERIFIED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  REJECTED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertCircle size={14} /> },
};

// --- Sub-components ---
const DeliveryStatCard = ({ label, value, colorClass, icon: Icon, isLoading }) => {
  return (
    <div className="bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-200 w-full max-w-[240px]">
      <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1.5 uppercase">{label}</p>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <span className={`text-3xl font-black ${colorClass || 'text-[#172B4D]'}`}>{value}</span>
        )}
      </div>
      {Icon && <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5"><span className="opacity-50"><Icon size={14} /></span> <span>Metrics</span></p>}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = POD_STATUS_CONFIG[status] || POD_STATUS_CONFIG.PENDING;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main Body Component ---
export default function DeliveryMainBody() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);

  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.status = filterStatus;

  const { data: deliveriesData, isLoading, refetch } = useDeliveries(queryParams);
  const deliveries = deliveriesData?.results || [];
  const totalCount = deliveriesData?.count || 0;

  // Global counts for stats 
  const stats = {
    total: totalCount,
    verified: deliveries.filter(d => d.status === 'VERIFIED').length,
    pending: deliveries.filter(d => d.status === 'PENDING').length,
    rejected: deliveries.filter(d => d.status === 'REJECTED').length,
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Deliveries & POD</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Verify Proof of Delivery (POD), track recipient signatures, and delivery timing.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
              >
                <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
             </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0747A6] shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} /> New POD Record
            </button>
          </div>
        </div>

        {/* POD Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DeliveryStatCard label="Total Deliveries" value={stats.total} colorClass="text-blue-600" icon={Shield} isLoading={isLoading} />
          <DeliveryStatCard label="Verified PODs" value={stats.verified} colorClass="text-green-600" icon={FileCheck} isLoading={isLoading} />
          <DeliveryStatCard label="Pending Approval" value={stats.pending} colorClass="text-amber-600" icon={Clock} isLoading={isLoading} />
          <DeliveryStatCard label="Rejected" value={stats.rejected} colorClass="text-red-600" icon={AlertCircle} isLoading={isLoading} />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Filters */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white items-center flex-wrap">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search POD Number, Recipient or Stop ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#0052CC] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <select 
                 className="flex-1 md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#0052CC]"
                 value={filterStatus}
                 onChange={(e) => {
                   setFilterStatus(e.target.value);
                   setPage(1);
                 }}
               >
                 <option>All Status</option>
                 <option>PENDING</option>
                 <option>SUBMITTED</option>
                 <option>VERIFIED</option>
                 <option>REJECTED</option>
               </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {page}
              </div>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!deliveriesData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-0">
             {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
                </div>
             ) : deliveries.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                  <FileCheck size={48} className="mb-4 opacity-20" />
                  <p>No delivery records found matching criteria</p>
                </div>
             ) : (
                <table className="w-full text-left border-collapse min-w-[1000px] relative">
                  <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">POD / Record</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recipient & Location</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Delivery Date</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {deliveries.map((pod) => (
                      <tr key={pod.id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                              <Hash size={14} className="text-gray-400" /> {pod.pod_number || pod.id?.slice(-8)}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase" title={pod.trip_stop}>
                              Stop: {pod.trip_stop || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
                              <User size={14} className="text-[#0052CC]" /> {pod.received_by || 'Unknown'}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                              <MapPin size={12} /> {pod.location || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                            <Calendar size={14} className="text-gray-400" /> {pod.delivery_date || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 items-start">
                            <StatusBadge status={pod.status} />
                            {pod.has_images && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase">
                                <ImageIcon size={12} /> Photo Attached
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setSelectedPod(pod);
                                setIsViewOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg" 
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {/* Further actions pending backend implementation */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{deliveries.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> POD Records
            </div>
          </div>
        </div>
      </div>

      <CreatePODModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      
      {selectedPod && (
        <ViewPODModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} item={selectedPod} />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Modals
// -----------------------------------------------------------------------------

function ViewPODModal({ isOpen, onClose, item }) {
  if (!item) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`POD Details: ${item.pod_number || item.id?.slice(-8)}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">POD Number</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1"><Hash size={14}/> {item.pod_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Status</p>
            <StatusBadge status={item.status || "PENDING"} />
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Recipient Name</p>
            <p className="font-semibold text-[#0052CC]">{item.received_by || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Location / Facility</p>
            <p className="font-semibold text-gray-900">{item.location || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Delivery Date</p>
            <p className="font-semibold text-gray-900">{item.delivery_date || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Trip / Stop Info</p>
            <p className="font-semibold text-gray-900 break-all">{item.trip_stop || item.trip || item.order || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreatePODModal({ isOpen, onClose }) {
  const createPODMutation = useCreatePOD();
  
  const [formData, setFormData] = useState({
    pod_number: "",
    trip_stop: "",
    received_by: "",
    status: "PENDING",
    delivery_date: "",
    location: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.pod_number) delete payload.pod_number;
    if (!payload.trip_stop) delete payload.trip_stop;
    if (!payload.received_by) delete payload.received_by;
    if (!payload.delivery_date) delete payload.delivery_date;
    if (!payload.location) delete payload.location;

    createPODMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
            pod_number: "", trip_stop: "", received_by: "", status: "PENDING", delivery_date: "", location: ""
        });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New POD Record">
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-gray-700 font-medium mb-1">POD Number</label>
             <input 
               type="text" 
               placeholder="Auto-generated if empty"
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
               value={formData.pod_number}
               onChange={e => setFormData({ ...formData, pod_number: e.target.value })}
             />
          </div>
          <div>
             <label className="block text-gray-700 font-medium mb-1">Status</label>
             <select
               required
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
               value={formData.status}
               onChange={e => setFormData({ ...formData, status: e.target.value })}
             >
               <option value="PENDING">PENDING</option>
               <option value="SUBMITTED">SUBMITTED</option>
               <option value="VERIFIED">VERIFIED</option>
               <option value="REJECTED">REJECTED</option>
             </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-gray-700 font-medium mb-1">Recipient Name *</label>
             <input 
               type="text" 
               required
               placeholder="Received by whom?"
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
               value={formData.received_by}
               onChange={e => setFormData({ ...formData, received_by: e.target.value })}
             />
          </div>
          <div>
             <label className="block text-gray-700 font-medium mb-1">Delivery Date *</label>
             <input 
               type="date" 
               required
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
               value={formData.delivery_date}
               onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-gray-700 font-medium mb-1">Location *</label>
             <input 
               type="text" 
               required
               placeholder="Warehouse, Port..."
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
               value={formData.location}
               onChange={e => setFormData({ ...formData, location: e.target.value })}
             />
          </div>
          <div>
             <label className="block text-gray-700 font-medium mb-1">Trip / Stop Reference</label>
             <input 
               type="text" 
               placeholder="Related trip/stop ID"
               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
               value={formData.trip_stop}
               onChange={e => setFormData({ ...formData, trip_stop: e.target.value })}
             />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button 
            type="submit" 
            disabled={createPODMutation.isPending}
            className="px-4 py-2 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] shadow-sm disabled:opacity-50"
          >
            {createPODMutation.isPending ? 'Submitting...' : 'Create POD'}
          </button>
        </div>
      </form>
    </Modal>
  );
}