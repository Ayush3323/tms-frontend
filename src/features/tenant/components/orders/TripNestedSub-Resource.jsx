import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, MapPin, FilePlus, Receipt, CreditCard, 
  History, Plus, Upload, Trash2, Calendar,
  DollarSign, Hash, CheckCircle2, Clock, 
  AlertCircle, ArrowLeft, Search, Loader2,
  ChevronRight, Map as MapIcon, Globe, FileText,
  RotateCcw, SlidersHorizontal, User, Edit3,
  ChevronLeft, Save, Gauge, Truck
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
  useUpdateTrip,
  useOrders
} from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';

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
  // API Hooks
  const { data: tripData, isLoading: loadingTrip, refetch: refetchTrip } = useTripDetail(tripId);
  const { data: stopsData, isLoading: loadingStops, refetch: refetchStops } = useTripStops(tripId);
  const { data: historyData, refetch: refetchHistory } = useTripStatusHistory(tripId);
  const { data: documentsData, refetch: refetchDocs } = useTripDocuments(tripId);
  const { data: expensesData, refetch: refetchExpenses } = useTripExpenses(tripId);
  const { data: chargesData, refetch: refetchCharges } = useTripCharges(tripId);

  // Safe data extraction
  const trip = tripData;
  const stops = stopsData?.results || (Array.isArray(stopsData) ? stopsData : []);
  const history = historyData?.results || (Array.isArray(historyData) ? historyData : []);
  const documents = documentsData?.results || (Array.isArray(documentsData) ? documentsData : []);
  const expenses = expensesData?.results || (Array.isArray(expensesData) ? expensesData : []);
  const charges = chargesData?.results || (Array.isArray(chargesData) ? chargesData : []);

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
               {/* Platform <ChevronRight size={12} /> Dashboard <ChevronRight size={12} /> <span className="text-[#3b82f6]">Orders</span> */}
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
           <StatItem label="TOTAL STOPS" value={stops.length} color="text-[#3b82f6]" />
           <StatItem label="DOCUMENTS" value={documents.length} color="text-emerald-500" />
           <StatItem label="PENDING EXPENSES" value={expenses.filter(e => e.status !== 'APPROVED').length} color="text-amber-500" />
           <StatItem label="TOTAL CHARGES" value={charges.length} color="text-rose-500" />
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
                 ) : !trip ? (
                   <div className="p-24 text-center space-y-4">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-lg font-black text-[#0f172a]">UNRESOLVED TRIP IDENTITY</h3>
                      <p className="text-sm text-[#64748b] max-w-sm mx-auto">
                        The ID provided is not associated with a valid trip record. Please search for a valid Trip ID using the bar above.
                      </p>
                   </div>
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
              <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.15em]"></div>
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

const FieldGroup = ({ label, children, required }) => (
  <div className="flex flex-col">
    <label className="block text-gray-700 font-medium mb-1 text-[11px] font-black text-[#64748b] uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-5 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-[14px] font-bold outline-none focus:border-[#3b82f6] transition-all";

export function EditTripModal({ isOpen, onClose, trip }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const mutation = useUpdateTrip();

  // Queries for lookups
  const { data: ordersData } = useOrders({ page_size: 100 });
  const orders = ordersData?.results || [];
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const [formData, setFormData] = useState({
    order_id: "", trip_number: "", lr_number: "", reference_number: "", trip_type: "FTL", status: "CREATED",
    primary_vehicle_id: null, vehicle_number: "", vehicle_type_code: "", vehicle_owner_name: "",
    primary_driver_id: null, alternate_vehicle_id: null, alternate_driver_id: null,
    origin_address: "", destination_address: "",
    created_date: new Date().toISOString().split('T')[0],
    scheduled_pickup_date: null, scheduled_delivery_date: null,
    actual_pickup_date: null, actual_delivery_date: null,
    start_time: null, end_time: null,
    total_distance_km: null, start_odometer_km: null, end_odometer_km: null,
    estimated_fuel_liters: null, actual_fuel_liters: null, fuel_rate_per_liter: null,
    damage_count: 0, damage_amount: "0.00", pod_turnaround_days: null,
    booked_price: null, total_freight_charge: "0.00", total_accessorial_charge: "0.00", total_tax: "0.00",
    tds_percentage: "0.00", tds_amount: "0.00", incentive_amount: "0.00", late_fee: "0.00",
    part_load_charge: "0.00", broker_commission: "0.00",
    total_bill_amount: "0.00", payment_received_amount: "0.00", payment_received_date: null,
    pod_received_date: null, is_billed: false, is_paid: false,
    remarks: "", version: 1
  });

  const [initialFormData, setInitialFormData] = useState(null);

  const steps = [
    { id: 1, name: 'General', icon: FileText },
    { id: 2, name: 'Fleet', icon: Truck },
    { id: 3, name: 'Route', icon: MapPin },
    { id: 4, name: 'Metrics', icon: Gauge },
    { id: 5, name: 'Finance', icon: DollarSign },
    { id: 6, name: 'Review', icon: CheckCircle2 }
  ];

  useEffect(() => {
    if (trip && isOpen) {
      const data = {
        ...formData,
        ...trip,
        // Ensure dates are formatted for input[type="date"]
        created_date: trip.created_date || new Date().toISOString().split('T')[0],
        scheduled_pickup_date: trip.scheduled_pickup_date || null,
        scheduled_delivery_date: trip.scheduled_delivery_date || null,
        actual_pickup_date: trip.actual_pickup_date || null,
        actual_delivery_date: trip.actual_delivery_date || null,
        payment_received_date: trip.payment_received_date || null,
        pod_received_date: trip.pod_received_date || null,
      };
      setFormData(data);
      setInitialFormData(data);
      setCurrentStep(1);
      setIsDirty(false);
    }
  }, [trip, isOpen, orders]);

  useEffect(() => {
    if (!initialFormData) return;
    const keys = Object.keys(formData);
    const changed = keys.some(key => {
      const initialValue = initialFormData[key];
      const currentValue = formData[key];
      if (initialValue === currentValue) return false;
      // Handle null vs empty string
      if ((initialValue === null || initialValue === "") && (currentValue === null || currentValue === "")) return false;
      // Handle numeric string comparison
      if (!isNaN(initialValue) && !isNaN(currentValue) && String(initialValue) !== "" && String(currentValue) !== "") {
        if (Number(initialValue) === Number(currentValue)) return false;
      }
      return true;
    });
    setIsDirty(changed);
  }, [formData, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOrderChange = (id) => {
    const order = orders.find(o => String(o.id) === String(id));
    setFormData(prev => ({
      ...prev,
      order_id: id,
      lr_number: order ? order.lr_number : ""
    }));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleUpdate = (e) => {
    if (e) e.preventDefault();
    mutation.mutate({ id: trip.id, data: formData }, {
      onSuccess: onClose
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-white/20">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-[#f1f5f9] flex justify-between items-center bg-gray-50/20">
          <div>
            <h2 className="text-xl font-black text-[#1e293b]">Edit Trip</h2>
            <p className="text-[11px] font-bold text-[#64748b] mt-1 uppercase tracking-wider">#{formData.trip_number}</p>
          </div>
          <button onClick={onClose} className="p-3.5 text-[#94a3b8] hover:text-[#1e293b] hover:bg-white border border-transparent hover:border-[#e2e8f0] rounded-[1.2rem] transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Horizontal Stepper */}
        <div className="px-10 py-6 bg-white border-b border-[#f1f5f9]">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#f1f5f9] -translate-y-1/2 -z-0"></div>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2.5 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                  <div 
                    className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center transition-all border-2 ${
                      isActive ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-xl shadow-blue-500/20 scale-110' : 
                      isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                      'bg-white border-[#f1f5f9] text-[#94a3b8]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-[#3b82f6]' : 'text-[#94a3b8]'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white/50">
          <form id="edit-trip-form" onSubmit={handleUpdate} className="space-y-8">
            
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-8">
                  <FieldGroup label="Active Order" required>
                    <select name="order_id" className={inputClass} value={formData.order_id || ""} onChange={e => handleOrderChange(e.target.value)}>
                      <option value="">Standalone Trip (No Order)</option>
                      {orders.map(o => <option key={o.id} value={o.id}>{o.lr_number} — {o.status}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Trip Number" required>
                    <input type="text" name="trip_number" required className={inputClass} value={formData.trip_number || ""} onChange={handleInputChange} />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-8">
                  <FieldGroup label="LR Number">
                    <input type="text" name="lr_number" className={inputClass} value={formData.lr_number || ""} onChange={handleInputChange} />
                  </FieldGroup>
                  <FieldGroup label="Reference Number">
                    <input type="text" name="reference_number" className={inputClass} value={formData.reference_number || ""} onChange={handleInputChange} />
                  </FieldGroup>
                  <FieldGroup label="Trip Type">
                    <select name="trip_type" className={inputClass} value={formData.trip_type || ""} onChange={handleInputChange}>
                      <option value="FTL">FTL</option>
                      <option value="LTL">LTL</option>
                      <option value="CONTAINER">CONTAINER</option>
                      <option value="COURIER">COURIER</option>
                    </select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <FieldGroup label="Status">
                    <select name="status" className={inputClass} value={formData.status || ""} onChange={handleInputChange}>
                      <option value="CREATED">CREATED</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="STARTED">STARTED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Created Date">
                    <input type="date" name="created_date" className={inputClass} value={formData.created_date || ""} onChange={handleInputChange} />
                  </FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-8">
                  <FieldGroup label="Primary Vehicle">
                    <select name="primary_vehicle_id" className={inputClass} value={formData.primary_vehicle_id || ""} onChange={handleInputChange}>
                      <option value="">Select Primary Vehicle</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Primary Driver">
                    <select name="primary_driver_id" className={inputClass} value={formData.primary_driver_id || ""} onChange={handleInputChange}>
                      <option value="">Select Primary Driver</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.first_name} {d.user?.last_name}</option>)}
                    </select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#f1f5f9]">
                  <FieldGroup label="Alternate Vehicle">
                    <select name="alternate_vehicle_id" className={inputClass} value={formData.alternate_vehicle_id || ""} onChange={handleInputChange}>
                      <option value="">None</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Alternate Driver">
                    <select name="alternate_driver_id" className={inputClass} value={formData.alternate_driver_id || ""} onChange={handleInputChange}>
                      <option value="">None</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.first_name} {d.user?.last_name}</option>)}
                    </select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-8">
                   <FieldGroup label="Vehicle Number"><input type="text" name="vehicle_number" className={inputClass} value={formData.vehicle_number || ""} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Vehicle Type Code"><input type="text" name="vehicle_type_code" className={inputClass} value={formData.vehicle_type_code || ""} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Vehicle Owner Name"><input type="text" name="vehicle_owner_name" className={inputClass} value={formData.vehicle_owner_name || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-8">
                  <FieldGroup label="Origin Address">
                    <textarea name="origin_address" rows="3" className={inputClass} value={formData.origin_address || ""} onChange={handleInputChange} />
                  </FieldGroup>
                  <FieldGroup label="Destination Address">
                    <textarea name="destination_address" rows="3" className={inputClass} value={formData.destination_address || ""} onChange={handleInputChange} />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#f1f5f9]">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Scheduled Pickup Date"><input type="date" name="scheduled_pickup_date" className={inputClass} value={formData.scheduled_pickup_date || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="Scheduled Delivery Date"><input type="date" name="scheduled_delivery_date" className={inputClass} value={formData.scheduled_delivery_date || ""} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Actual Pickup Date"><input type="date" name="actual_pickup_date" className={inputClass} value={formData.actual_pickup_date || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="Actual Delivery Date"><input type="date" name="actual_delivery_date" className={inputClass} value={formData.actual_delivery_date || ""} onChange={handleInputChange} /></FieldGroup>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <FieldGroup label="Start Time"><input type="time" name="start_time" className={inputClass} value={formData.start_time || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="End Time"><input type="time" name="end_time" className={inputClass} value={formData.end_time || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-3 gap-8">
                  <FieldGroup label="Total Distance (KM)"><input type="number" name="total_distance_km" className={inputClass} value={formData.total_distance_km || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Start ODO"><input type="number" name="start_odometer_km" className={inputClass} value={formData.start_odometer_km || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="End ODO"><input type="number" name="end_odometer_km" className={inputClass} value={formData.end_odometer_km || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[#f1f5f9]">
                  <FieldGroup label="Estimated Fuel (L)"><input type="number" name="estimated_fuel_liters" className={inputClass} value={formData.estimated_fuel_liters || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Actual Fuel (L)"><input type="number" name="actual_fuel_liters" className={inputClass} value={formData.actual_fuel_liters || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Fuel Rate"><input type="number" name="fuel_rate_per_liter" className={inputClass} value={formData.fuel_rate_per_liter || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <FieldGroup label="Damage Count"><input type="number" name="damage_count" className={inputClass} value={formData.damage_count || 0} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="POD Turnaround"><input type="number" name="pod_turnaround_days" className={inputClass} value={formData.pod_turnaround_days || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-4 gap-4">
                  <FieldGroup label="Booked Price"><input type="number" name="booked_price" className={inputClass} value={formData.booked_price || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Total Freight Charge"><input type="number" name="total_freight_charge" className={inputClass} value={formData.total_freight_charge || "0.00"} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Total Accessorial Charge"><input type="number" name="total_accessorial_charge" className={inputClass} value={formData.total_accessorial_charge || "0.00"} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Total Tax"><input type="number" name="total_tax" className={inputClass} value={formData.total_tax || "0.00"} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-6">
                   <FieldGroup label="TDS %"><input type="number" name="tds_percentage" className={inputClass} value={formData.tds_percentage || "0.00"} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="TDS Amount"><input type="number" name="tds_amount" className={inputClass} value={formData.tds_amount || "0.00"} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Incentive Amount"><input type="number" name="incentive_amount" className={inputClass} value={formData.incentive_amount || "0.00"} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-6">
                   <FieldGroup label="Late Fee"><input type="number" name="late_fee" className={inputClass} value={formData.late_fee || "0.00"} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Part Load Charge"><input type="number" name="part_load_charge" className={inputClass} value={formData.part_load_charge || "0.00"} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Damage Amount"><input type="number" name="damage_amount" className={inputClass} value={formData.damage_amount || "0.00"} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-8 border-t border-[#f1f5f9] pt-8">
                  <FieldGroup label="Broker Commission"><input type="number" name="broker_commission" className={inputClass} value={formData.broker_commission || "0.00"} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Total Bill Amount"><input type="number" name="total_bill_amount" className={inputClass} value={formData.total_bill_amount || "0.00"} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-8 border-t border-[#f1f5f9] pt-8">
                  <FieldGroup label="Payment Received Amount"><input type="number" name="payment_received_amount" className={inputClass} value={formData.payment_received_amount || "0.00"} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="Payment Received Date"><input type="date" name="payment_received_date" className={inputClass} value={formData.payment_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
                <div className="flex gap-10 items-center p-6 bg-gray-50 rounded-[1.5rem]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="is_billed" checked={formData.is_billed || false} onChange={handleInputChange} className="w-6 h-6 rounded-lg text-[#3b82f6] border-[#e2e8f0]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b]">Is Billed</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="is_paid" checked={formData.is_paid || false} onChange={handleInputChange} className="w-6 h-6 rounded-lg text-[#3b82f6] border-[#e2e8f0]" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b]">Is Paid</span>
                  </label>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-8">
                   <FieldGroup label="POD Received Date"><input type="date" name="pod_received_date" className={inputClass} value={formData.pod_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Remarks">
                     <textarea name="remarks" rows="3" className={inputClass} value={formData.remarks || ""} onChange={handleInputChange} />
                   </FieldGroup>
                </div>
                <FieldGroup label="Version">
                   <input type="number" name="version" className={inputClass} value={formData.version || 1} readOnly disabled />
                </FieldGroup>
              </div>
            )}
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="px-10 py-8 bg-gray-50 border-t border-[#f1f5f9] flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2.5 text-[#64748b] font-black text-[11px] uppercase tracking-widest hover:bg-white rounded-xl transition-all disabled:opacity-0 active:scale-95 border border-transparent hover:border-[#e2e8f0]"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            
            {isDirty && (
              <button 
                type="button"
                onClick={handleUpdate}
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
              >
                {mutation.isPending ? 'Syncing...' : 'Update'} <Save size={16} />
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            {currentStep < steps.length ? (
              <button 
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-10 py-3 bg-[#3b82f6] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                form="edit-trip-form"
                type="submit"
                disabled={mutation.isPending || !isDirty}
                className="flex items-center gap-2 px-12 py-3 bg-[#0f172a] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#1e293b] shadow-xl shadow-slate-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {mutation.isPending ? 'Syncing...' : 'Submit'} <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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