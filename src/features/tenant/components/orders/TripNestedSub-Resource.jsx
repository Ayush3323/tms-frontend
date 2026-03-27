import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, MapPin, FilePlus, Receipt, CreditCard, 
  History, Plus, Upload, Trash2, Calendar,
  DollarSign, Hash, CheckCircle2, Clock, 
  AlertCircle, ArrowLeft, Search, Loader2,
  ChevronRight, Map as MapIcon, Globe, FileText,
  RotateCcw, SlidersHorizontal, User, Edit3
} from 'lucide-react';
import {
  useCreateTripStop,
  useCreateTripDocument,
  useCreateTripExpense,
  useCreateTripCharge,
  useTripStatusHistory,
  useTripDetail, 
  useTripStops, 
  useTripDocuments, 
  useTripExpenses, 
  useTripCharges,
  useUpdateTrip
} from '../../queries/orders/ordersQuery';

// --- Dashboard Component ---

export default function TripNestedSubResource() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  
  // State for management
  const [tripId, setTripId] = useState(urlId || '');
  const [searchInput, setSearchInput] = useState(urlId || '');
  const [activeTab, setActiveTab] = useState('stops');
  const [activeModal, setActiveModal] = useState(null);

  // API Hooks
  const { data: trip, isLoading: loadingTrip, refetch: refetchTrip } = useTripDetail(tripId);
  const { data: stops, isLoading: loadingStops, refetch: refetchStops } = useTripStops(tripId);
  const { data: history, refetch: refetchHistory } = useTripStatusHistory(tripId);
  const { data: documents, refetch: refetchDocs } = useTripDocuments(tripId);
  const { data: expenses, refetch: refetchExpenses } = useTripExpenses(tripId);
  const { data: charges, refetch: refetchCharges } = useTripCharges(tripId);

  const handleRefresh = () => {
    if (!tripId) return;
    refetchTrip();
    refetchStops();
    refetchHistory();
    refetchDocs();
    refetchExpenses();
    refetchCharges();
  };

  const handleSearchTrip = (e) => {
    e.preventDefault();
    if (searchInput) {
      setTripId(searchInput);
      if (urlId) navigate(`/tenant/dashboard/orders/trips/${searchInput}/manage`);
    }
  };

  useEffect(() => {
    if (urlId) {
      setTripId(urlId);
      setSearchInput(urlId);
    }
  }, [urlId]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans text-[#1e293b]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* red-style dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#64748b] uppercase tracking-wider">
               Platform <ChevronRight size={12} /> Dashboard <ChevronRight size={12} /> <span className="text-[#3b82f6]">Orders</span>
            </div>
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight flex items-center gap-4">
              Trip Management Console
              {trip && (
                <button 
                  onClick={() => setActiveModal('editTrip')}
                  className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:text-[#3b82f6] hover:border-[#3b82f6]/30 shadow-sm transition-all"
                  title="Edit Core Trip Details"
                >
                  <Edit3 size={18} />
                </button>
              )}
            </h1>
            <p className="text-[#64748b] text-[15px]">Manage logistical stops, track status history, and verify compliance documents for trip: <span className="text-[#0f172a] font-bold">#{trip?.trip_number || tripId || 'None'}</span></p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleRefresh} className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#64748b] hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
                <RotateCcw size={16} /> Refresh Hub
             </button>
             <button 
               onClick={() => setActiveModal(activeTab.replace(/s$/, ''))}
               className="px-6 py-2.5 bg-[#3b82f6] text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
             >
                <Plus size={18} /> New {activeTab.replace(/s$/, '')} Entry
             </button>
          </div>
        </div>

        {/* Stats Summary Bar (Matches Screenshot Style) */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-8">
           <StatItem label="TOTAL STOPS" value={stops?.length || 0} color="text-[#3b82f6]" />
           <StatItem label="DOCUMENTS" value={documents?.length || 0} color="text-emerald-500" />
           <StatItem label="PENDING EXPENSES" value={expenses?.filter(e => e.status !== 'APPROVED').length || 0} color="text-amber-500" />
           <StatItem label="TOTAL CHARGES" value={charges?.length || 0} color="text-rose-500" />
        </div>

        {/* Search & Filter Workbench */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-6">
           <div className="flex flex-col md:flex-row items-center gap-4">
              <form onSubmit={handleSearchTrip} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input 
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Analyze Trip ID or Order Reference..." 
                  className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                />
              </form>
              <div className="flex items-center gap-2 bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0]">
                 <TabButton active={activeTab === 'stops'} onClick={() => setActiveTab('stops')} label="Stops" />
                 <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
                 <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} label="Documents" />
                 <TabButton active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} label="Finances" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <button className="p-3 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:bg-gray-50 shadow-sm"><SlidersHorizontal size={18} /></button>
                 <select className="px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-medium text-[#64748b] outline-none focus:border-[#3b82f6] min-w-[140px]">
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Verified</option>
                 </select>
              </div>
           </div>

           {/* Results Table/List (Clean Dashboard Style) */}
           <div className="border border-[#e2e8f0] rounded-xl overflow-hidden min-h-[400px]">
              <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 grid grid-cols-12 gap-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                 <div className="col-span-4">Resource / Identity</div>
                 <div className="col-span-3">Linked Entity</div>
                 <div className="col-span-3">Timeline Events</div>
                 <div className="col-span-1 text-center">Status</div>
                 <div className="col-span-1 text-center">Actions</div>
              </div>

              <div className="divide-y divide-[#e2e8f0] bg-white">
                 {loadingStops || loadingTrip ? (
                   <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#3b82f6]" size={32} /></div>
                 ) : (
                   <div className="animate-in fade-in duration-500">
                      {activeTab === 'stops' && <StopsList stops={stops} />}
                      {activeTab === 'history' && <HistoryList history={history} />}
                      {activeTab === 'documents' && <DocsList documents={documents} />}
                      {activeTab === 'finances' && <FinanceList expenses={expenses} charges={charges} />}
                   </div>
                 )}
              </div>
           </div>

           {/* Pagination Mock (Matches Screenshot) */}
           <div className="flex items-center justify-between pt-4 px-2">
              <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.1em]">Dashboard Results Summary</div>
              <div className="flex items-center gap-2">
                 <button className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#cbd5e1] cursor-not-allowed">Previous Page</button>
                 <button className="w-9 h-9 bg-[#3b82f6] text-white rounded-lg flex items-center justify-center font-bold text-[13px] shadow-md shadow-blue-500/20">1</button>
                 <button className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#64748b] hover:bg-gray-50 hover:text-blue-500 transition-all">Next Page</button>
              </div>
           </div>

        </div>
      </div>

      {/* Operation Modals */}
      <AddStopModal isOpen={activeModal === 'stop'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <AddDocumentModal isOpen={activeModal === 'document'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <AddExpenseModal isOpen={activeModal === 'expense'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <AddChargeModal isOpen={activeModal === 'charge'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <EditTripModal 
        isOpen={activeModal === 'editTrip'} 
        onClose={() => setActiveModal(null)} 
        trip={trip} 
      />
    </div>
  );
}

// --- Data Row Components ---

const StopsList = ({ stops }) => (
  <>
    {stops?.length > 0 ? stops.sort((a,b) => a.sequence_order - b.sequence_order).map((stop, i) => (
      <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all group">
         <div className="col-span-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shadow-sm ${stop.stop_type === 'PICKUP' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
               {stop.stop_type === 'PICKUP' ? '📦' : '🏗️'}
            </div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] tracking-tight">#{stop.sequence_order} - {stop.stop_type}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">STOP_ID: {stop.id?.slice(0, 16).toUpperCase()}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"><MapIcon size={16} /></div>
            <div>
               <p className="text-[14px] font-bold text-[#334155]">{stop.location_name}</p>
               <p className="text-[12px] text-[#64748b] font-medium">{stop.city}, {stop.state}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><Calendar size={16} /></div>
            <p className="text-[13px] font-bold text-[#475569] truncate">Scheduled Arrival Pending</p>
         </div>
         <div className="col-span-1 flex justify-center">
            <StatusIcon status={stop.status || 'PENDING'} />
         </div>
         <div className="col-span-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-blue-100"><Edit3 size={16} /></button>
            <button className="p-2 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-rose-100"><Trash2 size={16} /></button>
         </div>
      </div>
    )) : <EmptyState message="No Stops mapped for this trip route." />}
  </>
);

const HistoryList = ({ history }) => (
  <>
    {history?.length > 0 ? history.map((h, i) => (
      <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all">
         <div className="col-span-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[18px]">🕐</div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] tracking-tight truncate max-w-[200px]">{h.old_status} ⇢ {h.new_status}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">EVENT_LOG: {h.id?.slice(0, 16).toUpperCase()}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-3 px-2">
            <p className="text-[13px] text-[#64748b] italic">"{h.notes || 'System automated status transition.'}"</p>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><Clock size={16} /></div>
            <p className="text-[13px] font-bold text-[#475569]">{new Date(h.changed_at).toLocaleString()}</p>
         </div>
         <div className="col-span-1 flex justify-center"><StatusIcon status="COMPLETED" /></div>
         <div className="col-span-1 flex justify-center">
            <span className="text-[10px] font-black text-[#cbd5e1] uppercase tracking-widest">Logged</span>
         </div>
      </div>
    )) : <EmptyState message="No Status History records found." />}
  </>
);

const DocsList = ({ documents }) => (
  <>
    {documents?.length > 0 ? documents.map((doc, i) => (
      <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all group">
         <div className="col-span-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[18px]">📄</div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] uppercase tracking-tight">{doc.document_type}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">FILE_REF: {doc.id?.slice(0, 16).toUpperCase()}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-4">
             <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><User size={16} /></div>
             <div>
                <p className="text-[14px] font-bold text-[#334155]">{doc.remarks || 'Unassigned Remarks'}</p>
                <p className="text-[12px] text-[#64748b] font-medium">Compliance Review Portal</p>
             </div>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><Clock size={16} /></div>
            <p className="text-[13px] font-bold text-[#475569]">{new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}</p>
         </div>
         <div className="col-span-1 flex justify-center"><StatusIcon status="VERIFIED" /></div>
         <div className="col-span-1 flex justify-center gap-2">
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-3 bg-white border border-[#e2e8f0] text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6]/30 shadow-sm rounded-xl transition-all"><Globe size={16} /></a>
         </div>
      </div>
    )) : <EmptyState message="No Documents uploaded for verification." />}
  </>
);

const FinanceList = ({ expenses, charges }) => {
  const merged = [...(expenses || []).map(e => ({ ...e, res_type: 'EXPENSE' })), ...(charges || []).map(c => ({ ...c, res_type: 'CHARGE' }))];
  return (
    <>
      {merged.length > 0 ? merged.map((item, i) => (
        <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all group">
          <div className="col-span-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] border shadow-sm ${item.res_type === 'EXPENSE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
               {item.res_type === 'EXPENSE' ? '🧾' : '🔖'}
            </div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] uppercase tracking-tight">{item.expense_type || item.charge_type}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">{item.res_type}: {item.id?.slice(0, 16).toUpperCase()}</p>
            </div>
          </div>
          <div className="col-span-3 flex items-center gap-3">
             <div className="text-[17px] font-black text-[#0f172a]">₹{parseFloat(item.amount).toLocaleString()}</div>
             <span className="text-[10px] bg-slate-100 text-[#64748b] px-2 py-0.5 rounded font-black tracking-widest">{item.currency || 'INR'}</span>
          </div>
          <div className="col-span-3 flex items-center gap-3 px-2">
             <p className="text-[13px] text-[#64748b] font-medium truncate max-w-[200px]">{item.remarks || 'No supplementary notes.'}</p>
          </div>
          <div className="col-span-1 flex justify-center">
             <StatusIcon status={item.approval_status || 'PENDING'} />
          </div>
          <div className="col-span-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
             <button className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"><Edit3 size={16} /></button>
             <button className="p-2 text-gray-400 hover:text-rose-500 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>
      )) : <EmptyState message="No Financial records (Expenses/Charges) found." />}
    </>
  );
};

// --- Helper UI Components ---

const StatItem = ({ label, value, color }) => (
  <div className="flex flex-col gap-1 items-center md:items-start min-w-[140px] border-r last:border-0 border-[#e2e8f0] pr-8 last:pr-0">
     <div className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.14em]">{label}</div>
     <div className={`text-2xl font-black ${color} tracking-tight`}>{value}</div>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 text-[12px] font-black tracking-[0.08em] uppercase rounded-lg transition-all ${
      active ? 'bg-white text-[#3b82f6] shadow-md border border-[#e2e8f0]' : 'text-[#64748b] hover:text-[#3b82f6]'
    }`}
  >
    {label}
  </button>
);

const StatusIcon = ({ status }) => {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-500 border-amber-500/30',
    COMPLETED: 'bg-emerald-50 text-emerald-500 border-emerald-500/30',
    VERIFIED: 'bg-emerald-50 text-emerald-600 border-emerald-500/30',
    IN_TRANSIT: 'bg-blue-50 text-blue-500 border-blue-500/30'
  };
  return (
    <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${styles[status] || styles.PENDING}`}>
       <CheckCircle2 size={16} className={status === 'PENDING' ? 'opacity-30' : ''} />
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="p-24 flex flex-col items-center justify-center gap-5 text-center bg-gray-50/20">
     <div className="w-20 h-20 bg-white border border-[#e2e8f0] rounded-3xl flex items-center justify-center text-4xl shadow-sm animate-pulse grayscale opacity-40">📊</div>
     <p className="text-[13px] font-black text-[#cbd5e1] uppercase tracking-[0.15em] max-w-[200px] leading-relaxed">{message}</p>
  </div>
);

// --- Sub-resource Modals (Full Integration) ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="px-10 py-7 border-b border-[#f1f5f9] flex justify-between items-center text-[#1e293b] bg-gray-50/30">
          <h2 className="text-[13px] font-black uppercase tracking-[0.15em]">{title}</h2>
          <button onClick={onClose} className="p-3 text-[#94a3b8] hover:text-[#1e293b] hover:bg-white border border-transparent hover:border-[#e2e8f0] rounded-[1rem] transition-all shadow-sm"><X size={20} /></button>
        </div>
        <div className="p-10 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export function EditTripModal({ isOpen, onClose, trip }) {
  const [formData, setFormData] = useState({ 
    trip_number: '', 
    status: '', 
    vehicle_number: '', 
    origin_city: '', 
    destination_city: '' 
  });
  const mutation = useUpdateTrip();

  useEffect(() => {
    if (trip) setFormData({
      trip_number: trip.trip_number || '',
      status: trip.status || '',
      vehicle_number: trip.vehicle_number || '',
      origin_city: trip.origin_city || '',
      destination_city: trip.destination_city || ''
    });
  }, [trip]);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ id: trip.id, data: formData }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Core Trip Integration">
       <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
             <label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Trip Identifier</label>
             <input disabled className="w-full px-5 py-3.5 bg-gray-100 border border-[#e2e8f0] rounded-2xl text-[14px] font-bold text-[#94a3b8] cursor-not-allowed uppercase" value={formData.trip_number} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Fleet Assignment</label>
                <input className="w-full px-5 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-[14px] font-bold outline-none focus:border-[#3b82f6] uppercase" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
             </div>
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Operational Status</label>
                <select className="w-full px-5 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-[14px] font-bold outline-none focus:border-[#3b82f6]" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                   <option value="PLANNED">PLANNED</option>
                   <option value="IN_TRANSIT">IN TRANSIT</option>
                   <option value="COMPLETED">COMPLETED</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Node A (Origin)</label>
                <input className="w-full px-5 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-[14px] font-bold outline-none focus:border-[#3b82f6]" value={formData.origin_city} onChange={e => setFormData({...formData, origin_city: e.target.value})} />
             </div>
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Node B (Dest)</label>
                <input className="w-full px-5 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-[14px] font-bold outline-none focus:border-[#3b82f6]" value={formData.destination_city} onChange={e => setFormData({...formData, destination_city: e.target.value})} />
             </div>
          </div>
          <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-[#3b82f6] text-white rounded-2xl font-black uppercase tracking-[0.12em] hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 mt-4">
             {mutation.isLoading ? 'Processing Pipeline...' : 'Commit Trip Integration'}
          </button>
       </form>
    </Modal>
  );
}

export function AddStopModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ stop_type: 'PICKUP', sequence_order: 1, location_name: '', city: '', state: '' });
  const mutation = useCreateTripStop(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(formData, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Trip Stop">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Stop Type</label>
            <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.stop_type} onChange={e => setFormData({...formData, stop_type: e.target.value})}><option value="PICKUP">PICKUP</option><option value="DELIVERY">DELIVERY</option><option value="STOP">INTERMEDIATE</option></select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Sequence Code</label>
            <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.sequence_order} onChange={e => setFormData({...formData, sequence_order: parseInt(e.target.value)})} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Facility / Location Name</label>
          <input className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="E.g. Logistics Park A..." value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <input className="px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
          <input className="px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
        </div>
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-[#3b82f6] text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">{mutation.isLoading ? 'Registering...' : 'Register Logistical Stop'}</button>
      </form>
    </Modal>
  );
}

export function AddDocumentModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ document_type: 'POD', file_url: 'https://example.com/mock.pdf', remarks: '' });
  const mutation = useCreateTripDocument(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(formData, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Verification Entry">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Document Profile</label>
          <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.document_type} onChange={e => setFormData({...formData, document_type: e.target.value})}><option value="POD">PROOF OF DELIVERY</option><option value="EWAY_BILL">E-WAY BILL</option><option value="INVOICE">TAX INVOICE</option><option value="OTHER">OTHERS</option></select></div>
        <textarea className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Entry remarks or validation notes..." rows="3" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        <div className="p-12 border-2 border-dashed border-[#e2e8f0] rounded-[2rem] flex flex-col items-center justify-center text-center bg-[#f8fafc]/50">
          <Upload size={40} className="text-[#cbd5e1] mb-4 animate-bounce duration-1000" />
          <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Attach Digitized Verification</p>
        </div>
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-emerald-500 text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">{mutation.isLoading ? 'Processing...' : 'Securely Commit Entry'}</button>
      </form>
    </Modal>
  );
}

export function AddExpenseModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ expense_type: 'FUEL', amount: '', currency: 'INR', expense_date: new Date().toISOString().split('T')[0], remarks: '' });
  const mutation = useCreateTripExpense(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate({...formData, amount: parseFloat(formData.amount)}, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accrue Operational Expenditure">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Expenditure Category</label>
            <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.expense_type} onChange={e => setFormData({...formData, expense_type: e.target.value})}><option value="FUEL">FUEL</option><option value="TOLL">TOLL CHARGES</option><option value="PARKING">PARKING FEES</option><option value="OTHER">MISCELLANEOUS</option></select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Accrual Amount (₹)</label>
            <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[16px] font-black outline-none focus:border-[#3b82f6]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
        </div>
        <textarea className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Description of expenditure..." rows="3" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-amber-500 text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">{mutation.isLoading ? 'Recording...' : 'Record Expenditure'}</button>
      </form>
    </Modal>
  );
}

export function AddChargeModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ charge_type: 'BASE_FREIGHT', amount: '', currency: 'INR', is_taxable: true, remarks: '' });
  const mutation = useCreateTripCharge(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate({...formData, amount: parseFloat(formData.amount)}, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Service Accrual">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Service Type</label>
            <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.charge_type} onChange={e => setFormData({...formData, charge_type: e.target.value})}><option value="BASE_FREIGHT">BASE FREIGHT</option><option value="DETENTION">DETENTION</option><option value="HANDLING">HANDLING</option><option value="OTHER">ACCESSORIAL</option></select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Accrual Amount (₹)</label>
            <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[16px] font-black outline-none focus:border-[#3b82f6]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
        </div>
        <textarea className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Service remarks (optional)..." rows="3" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-[#3b82f6] text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">{mutation.isLoading ? 'Processing...' : 'Register Accrual'}</button>
      </form>
    </Modal>
  );
}