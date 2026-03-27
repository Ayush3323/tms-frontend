import React, { useState } from 'react';
import { FileText, Plus, Search, RefreshCw, Download, Upload, X, RotateCcw } from 'lucide-react';
import { useDocuments } from '../../../queries/drivers/driverDocumentQuery';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import DocumentTable from '../sub-features/Documents/DocumentTable';
import { AddDocumentModal, EditDocumentModal, DeleteDocumentDialog, ViewDocumentModal } from '../sub-features/Documents/DocumentModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { useUsers as useSystemUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { DOCUMENT_TYPES, VERIFICATION_LIST } from '../common/constants';
import Select from '../common/Select';
import Input from '../common/Input';
import { useDebounce } from '../common/hooks';

const AllDocuments = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);

  const [filters, setFilters] = useState({
    driver: '',
    document_type: '',
    verification_status: '',
    expiry_date: '',
    search: '',
  });

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync debounced search to filters
  React.useEffect(() => {
    handleFilterChange('search', debouncedSearch);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch, isFetching } = useDocuments(filters);
  const driverMap = useDriverLookup();
  const { data: usersData, isLoading: isLoadingUsers } = useSystemUsers({ page_size: 100 });
  const { data: currentUser } = useCurrentUser();
  
  const userMap = React.useMemo(() => {
    return usersData?.results?.reduce((acc, u) => ({ 
      ...acc, 
      [u.id]: {
        ...u,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User'
      }
    }), {}) ?? {};
  }, [usersData]);

  const documents = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      driver: '',
      document_type: '',
      verification_status: '',
      expiry_date: '',
      search: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={5}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-40' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-20', type: 'mono' }, // Emp ID
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-32', type: 'multiline' }, // Doc Type
        { headerWidth: 'w-20', cellWidth: 'w-20', width: 'w-28', type: 'mono' }, // Doc Num
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // Expiry
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Authority
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Verification
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // File URL
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-16', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <div className="p-6"><ErrorState message="Failed to load documents" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen && <AddDocumentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editDoc && <EditDocumentModal doc={editDoc} driverId={editDoc.driver} onClose={() => setEditDoc(null)} userMap={userMap} isLoadingUsers={isLoadingUsers} />}
      {viewDoc && (
        <ViewDocumentModal 
          doc={viewDoc} 
          onClose={() => setViewDoc(null)} 
          userMap={userMap} 
          driverMap={driverMap} 
          isLoadingUsers={isLoadingUsers} 
        />
      )}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Driver Documents</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Manage all documents across all registered drivers</p>
          </div>
          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300" size={20} />
              <input
                type="text"
                placeholder="Search by number or authority..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all p-1.5 rounded-full hover:bg-red-50">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95 group">
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /><span>Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                <Upload size={14} /><span>Import</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                <Download size={14} /><span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
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
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Documents:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Verified:</span>
                  <span className="text-[18px] font-black text-green-600">{documents.filter(d => d.verification_status === 'VERIFIED').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Pending:</span>
                  <span className="text-[18px] font-black text-amber-600">{documents.filter(d => d.verification_status === 'PENDING').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expired:</span>
                  <span className="text-[18px] font-black text-red-600">{documents.filter(d => d.is_expired).length}</span>
                </div>
              </>
            )}
            <div className="ml-auto flex justify-end">
              <button onClick={() => setAddOpen(true)} className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Document
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/30 overflow-x-auto no-scrollbar">
            <DriverSelect 
              value={filters.driver} 
              onChange={(val) => handleFilterChange('driver', val)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors" 
            />
            <Select 
              value={filters.document_type} 
              onChange={(e) => handleFilterChange('document_type', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-white border border-gray-200 hover:bg-[#EDF1F7] transition-colors min-w-[120px]"
            >
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
            <Select 
              value={filters.verification_status} 
              onChange={(e) => handleFilterChange('verification_status', e.target.value)}
              className="text-xs py-1.5 font-bold text-[#172B4D] rounded-lg bg-[#EDF1F7] border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors min-w-[120px]"
            >
              <option value="">All Status</option>
              {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-2 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Expiry:</span>
              <input 
                type="date" 
                value={filters.expiry_date} 
                onChange={(e) => handleFilterChange('expiry_date', e.target.value)}
                className="text-xs py-1 px-1 bg-transparent border-none focus:ring-0 font-bold text-[#172B4D]" 
              />
            </div>
            {(filters.driver || filters.document_type || filters.verification_status || filters.expiry_date) && (
              <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear Filters">
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 overflow-auto">
            {documents.length === 0 ? (
              <div className="py-20">
                <EmptyState
                  icon={FileText}
                  title="No documents found"
                  description="There are no documents uploaded for any driver yet."
                />
              </div>
            ) : (
              <DocumentTable
                documents={documents}
                onView={setViewDoc}
                onEdit={setEditDoc}
                showDriver={true}
                driverMap={driverMap}
                userMap={userMap}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllDocuments;
