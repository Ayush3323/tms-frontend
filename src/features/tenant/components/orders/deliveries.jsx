import React, { useState } from 'react';
import {
  Shield, CheckCircle2, Clock, AlertCircle,
  Search, Filter, Download, Plus,
  MapPin, User, FileCheck, Image as ImageIcon,
  MoreHorizontal, Eye, Edit2, Trash2,
  ExternalLink, Calendar, Hash, RefreshCcw, X,
  History, FileText, Receipt, CreditCard, Layers, ArrowRight,
  TrendingUp, Wallet, Paperclip
} from 'lucide-react';
import {
  useDeliveries, useCreatePOD,
  useTripStops, useTripStatusHistory,
  useTripDocuments, useTripExpenses,
  useTripCharges, useCreateTripStop,
  useCreateTripDocument, useCreateTripExpense,
  useCreateTripCharge, useTripDetail, useDeliveryDetail
} from '../../queries/orders/ordersQuery';

// --- Configuration & Status Badges ---
const POD_STATUS_CONFIG = {
  PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
  SUBMITTED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <FileCheck size={14} /> },
  VERIFIED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  REJECTED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertCircle size={14} /> },
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

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Deliveries:</span>
                  <span className="text-[18px] font-black text-blue-600">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Verified PODs:</span>
                  <span className="text-[18px] font-black text-green-600">{stats.verified}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Pending Approval:</span>
                  <span className="text-[18px] font-black text-amber-600">{stats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Rejected:</span>
                  <span className="text-[18px] font-black text-red-600">{stats.rejected}</span>
                </div>
              </>
            )}
          </div>
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
<<<<<<< Updated upstream
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
=======
          <div className="overflow-x-auto min-h-[400px]">
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
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
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
                        <div className="flex items-center justify-end gap-2 transition-opacity">
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
>>>>>>> Stashed changes
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
<<<<<<< Updated upstream
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{deliveries.length}</span> of <span className="font-bold text-[#172B4D]">{totalCount}</span> POD Records
=======
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Showing {deliveries.length} of {totalCount} POD Records</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded bg-[#0052CC] text-white">
                {page}
              </button>
              <button
                disabled={!deliveriesData?.next}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
>>>>>>> Stashed changes
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
  const [activeTab, setActiveTab] = useState('general');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: podDetail, isLoading: loadingPod } = useDeliveryDetail(item?.id);
  const pod = podDetail || item;

  // Resolve tripId from the POD item (assuming the backend includes trip_id or trip in the response)
  const tripId = pod?.trip_id || pod?.trip || item?.trip_stop?.trip_id;

  const { data: trip } = useTripDetail(tripId);
  const { data: stops, isLoading: loadingStops } = useTripStops(tripId);
  const { data: history, isLoading: loadingHistory } = useTripStatusHistory(tripId);
  const { data: documents, isLoading: loadingDocs } = useTripDocuments(tripId);
  const { data: expenses, isLoading: loadingExpenses } = useTripExpenses(tripId);
  const { data: charges, isLoading: loadingCharges } = useTripCharges(tripId);

  // Creation Mutations
  const createStopMutation = useCreateTripStop(tripId);
  const createDocMutation = useCreateTripDocument(tripId);
  const createExpenseMutation = useCreateTripExpense(tripId);
  const createChargeMutation = useCreateTripCharge(tripId);

  // Inline Form States
  const [stopData, setStopData] = useState({ stop_type: 'PICKUP', sequence_order: '', location_name: '', city: '', state: '' });
  const [docData, setDocData] = useState({ document_type: 'POD', file_url: '', remarks: '' });
  const [expData, setExpData] = useState({ expense_type: 'TOLL', amount: '', currency: 'INR', expense_date: new Date().toISOString().slice(0, 10), remarks: '' });
  const [chgData, setChgData] = useState({ charge_type: 'BASE_FREIGHT', amount: '', currency: 'INR', is_taxable: true, remarks: '' });

  const resetForm = () => {
    setShowAddForm(false);
    setStopData({ stop_type: 'PICKUP', sequence_order: '', location_name: '', city: '', state: '' });
    setDocData({ document_type: 'POD', file_url: '', remarks: '' });
    setExpData({ expense_type: 'TOLL', amount: '', currency: 'INR', expense_date: new Date().toISOString().slice(0, 10), remarks: '' });
    setChgData({ charge_type: 'BASE_FREIGHT', amount: '', currency: 'INR', is_taxable: true, remarks: '' });
  };

  if (!item) return null;

  const tabs = [
    { id: 'general', label: 'POD Info', icon: FileCheck },
    { id: 'stops', label: 'Trip Stops', icon: MapPin },
    { id: 'history', label: 'History', icon: History },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'finances', label: 'Finances', icon: Wallet },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`POD & Trip Console: ${item.pod_number || item.id?.slice(-8)}`}>
      <div className="flex flex-col h-full max-h-[70vh]">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                  ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/30'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {loadingPod && <div className="text-center py-4 text-xs text-gray-400">Loading details...</div>}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">POD Number</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1"><Hash size={14} /> {pod.pod_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Delivery Status</p>
                  <p className="text-xs font-black text-blue-600 uppercase border-b-2 border-blue-100 pb-0.5 inline-block">{pod.delivery_status || pod.status || 'DELIVERED'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Recipient Name / Relation</p>
                  <p className="font-semibold text-[#0052CC]">{pod.received_by_name || pod.received_by || 'N/A'} {pod.received_by_relation ? <span className="text-gray-400 font-medium ml-1">({pod.received_by_relation})</span> : ''}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Delivery Date (Time)</p>
                  <p className="font-semibold text-gray-900">{pod.delivery_date ? new Date(pod.delivery_date).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Remarks</p>
                  <p className="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3 py-1">{pod.remarks || 'No remarks provided'}</p>
                </div>
                {pod.damage_notes && (
                  <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-red-500 font-bold mb-1 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><AlertCircle size={12} /> Damage Notes</p>
                    <p className="text-xs text-red-700 font-medium">{pod.damage_notes}</p>
                  </div>
                )}
                {pod.shortage_notes && (
                  <div className="col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <p className="text-amber-500 font-bold mb-1 text-[10px] uppercase tracking-wider flex items-center gap-1.5"><AlertCircle size={12} /> Shortage Notes</p>
                    <p className="text-xs text-amber-700 font-medium">{pod.shortage_notes}</p>
                  </div>
                )}
                <div className="col-span-2 bg-gray-100/50 p-3 rounded-lg grid grid-cols-2 gap-4 border-dashed border border-gray-200">
                  <div>
                    <p className="text-gray-400 font-bold mb-1 text-[9px] uppercase tracking-widest">Linked Stop UUID</p>
                    <p className="font-mono text-[10px] text-gray-600 break-all">{pod.trip_stop || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold mb-1 text-[9px] uppercase tracking-widest">GPS Coordinates</p>
                    <p className="text-[10px] font-bold text-gray-800 tracking-tighter">{pod.delivery_latitude || '0.0'}, {pod.delivery_longitude || '0.0'}</p>
                    {pod.location_accuracy_meters && <p className="text-[9px] text-gray-500 italic mt-0.5">Accuracy: {pod.location_accuracy_meters}m</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stops' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                <h4 className="text-[10px] font-black uppercase text-blue-700 tracking-widest flex items-center gap-2"><Layers size={14} /> Stop Sequence</h4>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-[9px] font-black uppercase text-blue-600 bg-white px-2 py-1 rounded border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  {showAddForm ? 'Cancel' : '+ Add Stop'}
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const payload = { ...stopData, sequence_order: parseInt(stopData.sequence_order) };
                    createStopMutation.mutate(payload, { onSuccess: resetForm });
                  }}
                  className="bg-blue-50/20 p-4 rounded-lg border-2 border-dashed border-blue-200 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Location Name" required className="p-2 text-xs border rounded" value={stopData.location_name} onChange={e => setStopData({ ...stopData, location_name: e.target.value })} />
                    <select className="p-2 text-xs border rounded" value={stopData.stop_type} onChange={e => setStopData({ ...stopData, stop_type: e.target.value })}>
                      <option value="PICKUP">PICKUP</option>
                      <option value="DELIVERY">DELIVERY</option>
                      <option value="DEPOT">DEPOT</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="number" placeholder="Seq" required className="p-2 text-xs border rounded" value={stopData.sequence_order} onChange={e => setStopData({ ...stopData, sequence_order: e.target.value })} />
                    <input type="text" placeholder="City" required className="p-2 text-xs border rounded" value={stopData.city} onChange={e => setStopData({ ...stopData, city: e.target.value })} />
                    <input type="text" placeholder="State/ST" required className="p-2 text-xs border rounded" value={stopData.state} onChange={e => setStopData({ ...stopData, state: e.target.value })} />
                  </div>
                  <button type="submit" disabled={createStopMutation.isPending} className="w-full py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50">
                    {createStopMutation.isPending ? 'Saving...' : 'Confirm Stop'}
                  </button>
                </form>
              )}
              <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {loadingStops ? (
                  <div className="text-center py-8 text-gray-400 text-xs animate-pulse">Loading stop data...</div>
                ) : stops?.length > 0 ? stops.map((stop, idx) => (
                  <div key={stop.id} className="relative">
                    <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${stop.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Stop #{stop.sequence_order} • {stop.stop_type}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${stop.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{stop.status}</span>
                      </div>
                      <p className="text-sm font-bold text-[#172B4D]">{stop.location_name}</p>
                      <p className="text-[11px] text-gray-500 font-medium">{stop.city}, {stop.state}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <MapPin size={32} className="mx-auto text-gray-300 mb-2 opacity-30" />
                    <p className="text-xs text-gray-400 font-medium tracking-tight">No sequence data available for this trip</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
              {loadingHistory ? (
                <div className="py-12 text-center text-gray-400 text-xs">Loading history...</div>
              ) : history?.length > 0 ? (
                <div className="space-y-3">
                  {history.map((log) => (
                    <div key={log.id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-lg">
                      <div className="flex flex-col items-center">
                        <History size={16} className="text-gray-300" />
                        <div className="w-0.5 h-full bg-gray-50 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.old_status}</span>
                          <ArrowRight size={10} className="text-gray-300" />
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.new_status}</span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium">{log.notes || 'Status updated'}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic">{new Date(log.changed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <History size={32} className="mx-auto text-gray-300 mb-2 opacity-30" />
                  <p className="text-xs text-gray-400 font-medium">No status history found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-gray-500">
                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Paperclip size={14} /> Linked Assets</h4>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-[9px] font-black uppercase text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 hover:bg-gray-800 hover:text-white transition-all"
                >
                  {showAddForm ? 'Cancel' : '+ Upload Doc'}
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createDocMutation.mutate(docData, { onSuccess: resetForm });
                  }}
                  className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200 space-y-3"
                >
                  <select className="w-full p-2 text-xs border rounded" value={docData.document_type} onChange={e => setDocData({ ...docData, document_type: e.target.value })}>
                    <option value="EWAY_BILL">EWAY_BILL</option>
                    <option value="INVOICE">INVOICE</option>
                    <option value="POD">POD</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                  <input type="url" placeholder="File URL (https://...)" required className="w-full p-2 text-xs border rounded" value={docData.file_url} onChange={e => setDocData({ ...docData, file_url: e.target.value })} />
                  <input type="text" placeholder="Remarks" className="w-full p-2 text-xs border rounded" value={docData.remarks} onChange={e => setDocData({ ...docData, remarks: e.target.value })} />
                  <button type="submit" disabled={createDocMutation.isPending} className="w-full py-2 bg-gray-800 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50">
                    {createDocMutation.isPending ? 'Uploading...' : 'Save Document'}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 gap-2 pt-2">
                {loadingDocs ? (
                  <div className="py-8 text-center text-gray-400 text-xs">Loading documents...</div>
                ) : documents?.length > 0 ? documents.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                    <div className="p-2 bg-gray-50 rounded group-hover:bg-blue-50 transition-colors text-gray-400 group-hover:text-blue-500">
                      <Paperclip size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">{doc.document_type}</p>
                      <p className="text-[10px] text-gray-400 truncate italic">{doc.file_url}</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-400" />
                  </a>
                )) : (
                  <div className="py-12 text-center bg-gray-100/30 rounded-xl border border-dashed border-gray-200">
                    <FileText size={40} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400 font-medium">No documents uploaded for this trip</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button onClick={() => setShowAddForm(showAddForm === 'expense' ? false : 'expense')} className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${showAddForm === 'expense' ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50'}`}>+ Record Expense</button>
                <button onClick={() => setShowAddForm(showAddForm === 'charge' ? false : 'charge')} className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm ${showAddForm === 'charge' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-green-600 border-green-100 hover:bg-green-50'}`}>+ Add Charge</button>
              </div>

              {showAddForm === 'expense' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createExpenseMutation.mutate({ ...expData, amount: expData.amount.toString() }, { onSuccess: resetForm });
                  }}
                  className="bg-amber-50 p-4 rounded-lg border-2 border-dashed border-amber-200 animate-in zoom-in-95 duration-200"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select className="p-2 text-xs border rounded" value={expData.expense_type} onChange={e => setExpData({ ...expData, expense_type: e.target.value })}>
                      <option value="TOLL">TOLL</option>
                      <option value="FUEL">FUEL</option>
                      <option value="PARKING">PARKING</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                    <input type="number" placeholder="Amount" required className="p-2 text-xs border rounded" value={expData.amount} onChange={e => setExpData({ ...expData, amount: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input type="date" required className="p-2 text-xs border rounded" value={expData.expense_date} onChange={e => setExpData({ ...expData, expense_date: e.target.value })} />
                    <input type="text" placeholder="Remarks" className="p-2 text-xs border rounded" value={expData.remarks} onChange={e => setExpData({ ...expData, remarks: e.target.value })} />
                  </div>
                  <button type="submit" disabled={createExpenseMutation.isPending} className="w-full py-2 bg-amber-600 text-white rounded text-xs font-bold uppercase tracking-widest">
                    {createExpenseMutation.isPending ? 'Recording...' : 'Save Expense'}
                  </button>
                </form>
              )}

              {showAddForm === 'charge' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createChargeMutation.mutate({ ...chgData, amount: chgData.amount.toString() }, { onSuccess: resetForm });
                  }}
                  className="bg-green-50 p-4 rounded-lg border-2 border-dashed border-green-200 animate-in zoom-in-95 duration-200"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select className="p-2 text-xs border rounded" value={chgData.charge_type} onChange={e => setChgData({ ...chgData, charge_type: e.target.value })}>
                      <option value="BASE_FREIGHT">BASE_FREIGHT</option>
                      <option value="DETENTION">DETENTION</option>
                      <option value="HANDLING">HANDLING</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                    <input type="number" placeholder="Amount" required className="p-2 text-xs border rounded" value={chgData.amount} onChange={e => setChgData({ ...chgData, amount: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-green-700">
                      <input type="checkbox" checked={chgData.is_taxable} onChange={e => setChgData({ ...chgData, is_taxable: e.target.checked })} /> Taxable
                    </label>
                    <input type="text" placeholder="Remarks" className="flex-1 p-2 text-xs border rounded" value={chgData.remarks} onChange={e => setChgData({ ...chgData, remarks: e.target.value })} />
                  </div>
                  <button type="submit" disabled={createChargeMutation.isPending} className="w-full py-2 bg-green-600 text-white rounded text-xs font-bold uppercase tracking-widest">
                    {createChargeMutation.isPending ? 'Saving...' : 'Confirm Charge'}
                  </button>
                </form>
              )}

              {/* Expenses Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2 border-b border-amber-100 pb-1"><Receipt size={14} /> Trip Expenses</h4>
                <div className="space-y-2">
                  {loadingExpenses ? (
                    <div className="py-4 text-center text-gray-400 text-[10px]">Loading expenses...</div>
                  ) : expenses?.length > 0 ? expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2.5 bg-white border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{exp.expense_type}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{exp.expense_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-amber-600">{exp.currency} {exp.amount}</p>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded uppercase tracking-tighter">{exp.approval_status}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-4 text-xs text-gray-400 italic">No expenses recorded</p>
                  )}
                </div>
              </div>

              {/* Charges Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-2 border-b border-green-100 pb-1"><CreditCard size={14} /> Client Charges</h4>
                <div className="space-y-2">
                  {loadingCharges ? (
                    <div className="py-4 text-center text-gray-400 text-[10px]">Loading charges...</div>
                  ) : charges?.length > 0 ? charges.map(chg => (
                    <div key={chg.id} className="flex justify-between items-center p-2.5 bg-white border border-gray-100 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{chg.charge_type}</p>
                        <p className="text-[9px] text-gray-400 italic">{chg.remarks || 'No remarks'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-600">{chg.currency} {chg.amount}</p>
                        {chg.tax_amount > 0 && <p className="text-[8px] font-bold text-gray-400 italic">+ Tax: {chg.tax_amount}</p>}
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-4 text-xs text-gray-400 italic">No billing charges added</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 mt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2.5 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] shadow-md shadow-blue-200 text-sm font-black uppercase tracking-widest transition-all">
            Close Console
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreatePODModal({ isOpen, onClose }) {
  const createPODMutation = useCreatePOD();

  const [formData, setFormData] = useState({
    trip_stop: "",
    delivery_date: new Date().toISOString().slice(0, 16),
    received_by_name: "",
    received_by_relation: "",
    delivery_status: "DELIVERED",
    remarks: "",
    damage_notes: "",
    shortage_notes: "",
    pod_number: "",
    signature_url: "",
    delivery_latitude: "",
    delivery_longitude: "",
    location_accuracy_meters: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };

    // Format delivery_date to ISO 8601 if it's a local datetime-local string
    if (payload.delivery_date) {
      payload.delivery_date = new Date(payload.delivery_date).toISOString();
    }

    // Convert numeric fields
    if (payload.delivery_latitude) payload.delivery_latitude = parseFloat(payload.delivery_latitude);
    if (payload.delivery_longitude) payload.delivery_longitude = parseFloat(payload.delivery_longitude);
    if (payload.location_accuracy_meters) payload.location_accuracy_meters = parseFloat(payload.location_accuracy_meters);

    // Clean up empty optional fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === "" || payload[key] === null) {
        delete payload[key];
      }
    });

    createPODMutation.mutate(payload, {
      onSuccess: () => {
        setFormData({
          trip_stop: "", delivery_date: new Date().toISOString().slice(0, 16),
          received_by_name: "", received_by_relation: "", delivery_status: "DELIVERED",
          remarks: "", damage_notes: "", shortage_notes: "", pod_number: "",
          signature_url: "", delivery_latitude: "", delivery_longitude: "",
          location_accuracy_meters: ""
        });
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New POD Record">
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Essential Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">Trip Stop UUID (Required) *</label>
              <input
                type="text"
                required
                placeholder="Paste stop UUID..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
                value={formData.trip_stop}
                onChange={e => setFormData({ ...formData, trip_stop: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">Delivery Date & Time *</label>
              <input
                type="datetime-local"
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
                value={formData.delivery_date}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">Recipient Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
                value={formData.received_by_name}
                onChange={e => setFormData({ ...formData, received_by_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">Relation / Role</label>
              <input
                type="text"
                placeholder="e.g. Warehouse Manager"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
                value={formData.received_by_relation}
                onChange={e => setFormData({ ...formData, received_by_relation: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Delivery Status & Notes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">Delivery Status</label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none font-bold"
                value={formData.delivery_status}
                onChange={e => setFormData({ ...formData, delivery_status: e.target.value })}
              >
                <option value="DELIVERED">DELIVERED</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="REFUSED">REFUSED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">POD Number (Manual)</label>
              <input
                type="text"
                placeholder="Optional reference"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
                value={formData.pod_number}
                onChange={e => setFormData({ ...formData, pod_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">General Remarks</label>
            <textarea
              rows="2"
              placeholder="Condition of goods, signature notes..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC] outline-none"
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-0.5 uppercase text-[9px] text-red-600">Damage Notes</label>
              <input
                type="text"
                placeholder="Describe any damage"
                className="w-full p-2 border border-red-100 bg-red-50/30 rounded text-xs outline-none"
                value={formData.damage_notes}
                onChange={e => setFormData({ ...formData, damage_notes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-0.5 uppercase text-[9px] text-amber-600">Shortage Notes</label>
              <input
                type="text"
                placeholder="Missing items counter"
                className="w-full p-2 border border-amber-100 bg-amber-50/30 rounded text-xs outline-none"
                value={formData.shortage_notes}
                onChange={e => setFormData({ ...formData, shortage_notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Location & Metadata</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-400 font-bold mb-1 uppercase text-[9px]">Latitude</label>
              <input type="number" step="any" placeholder="0.0000" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={formData.delivery_latitude} onChange={e => setFormData({ ...formData, delivery_latitude: e.target.value })} />
            </div>
            <div>
              <label className="block text-gray-400 font-bold mb-1 uppercase text-[9px]">Longitude</label>
              <input type="number" step="any" placeholder="0.0000" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={formData.delivery_longitude} onChange={e => setFormData({ ...formData, delivery_longitude: e.target.value })} />
            </div>
            <div>
              <label className="block text-gray-400 font-bold mb-1 uppercase text-[9px]">Accuracy (m)</label>
              <input type="number" step="0.1" placeholder="meters" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={formData.location_accuracy_meters} onChange={e => setFormData({ ...formData, location_accuracy_meters: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 font-bold mb-1 uppercase text-[9px]">Signature URL</label>
            <input type="text" placeholder="https://..." className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs" value={formData.signature_url} onChange={e => setFormData({ ...formData, signature_url: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-all">Cancel</button>
          <button
            type="submit"
            disabled={createPODMutation.isPending}
            className="px-6 py-2.5 text-white bg-[#0052CC] rounded-lg hover:bg-[#0747A6] shadow-md shadow-blue-200 disabled:opacity-50 font-bold transition-all"
          >
            {createPODMutation.isPending ? 'Logging POD...' : 'Confirm Delivery'}
          </button>
        </div>
      </form>
    </Modal>
  );
}