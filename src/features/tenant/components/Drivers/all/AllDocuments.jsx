import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useDocuments } from '../../../queries/drivers/driverDocumentQuery';

import { LoadingState, ErrorState, EmptyState, GenericTableShimmer, PageLayoutShimmer } from '../common/StateFeedback';
import DocumentTable from '../sub-features/Documents/DocumentTable';
import { AddDocumentModal, EditDocumentModal, DeleteDocumentDialog } from '../sub-features/Documents/DocumentModals';
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
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Issue Date
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24', type: 'mono' }, // Expiry
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Authority
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' }, // Verification
        { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-24' }, // Verified By
        { headerWidth: 'w-28', cellWidth: 'w-32', width: 'w-32' }, // Verified At
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // File URL
        { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-40' }, // Notes
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

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Driver Documents</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all documents across all registered drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg shadow-sm hover:bg-[#0043A8] transition-all"
            >
              <Plus size={16} /> Add Document
            </button>
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
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
            <div className="flex gap-3 items-center flex-wrap flex-1">
              <div className="flex flex-col w-48">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
                <DriverSelect 
                  value={filters.driver} 
                  onChange={(val) => handleFilterChange('driver', val)} 
                  className="bg-white border-gray-200 text-[12px] py-1.5 font-medium text-[#172B4D] rounded-lg"
                />
              </div>
              <div className="flex flex-col w-40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Doc Type</p>
                <Select 
                  value={filters.document_type} 
                  onChange={(e) => handleFilterChange('document_type', e.target.value)}
                  className="bg-white border-gray-200 text-[12px] py-1.5 font-medium text-[#172B4D] rounded-lg"
                >
                  <option value="">All Types</option>
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </Select>
              </div>
              <div className="flex flex-col w-40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
                <Select 
                  value={filters.verification_status} 
                  onChange={(e) => handleFilterChange('verification_status', e.target.value)}
                  className="bg-white border-gray-200 text-[12px] py-1.5 font-medium text-[#172B4D] rounded-lg"
                >
                  <option value="">All Status</option>
                  {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div className="flex flex-col w-40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</p>
                <Input 
                  type="date" 
                  value={filters.expiry_after} 
                  onChange={(e) => handleFilterChange('expiry_after', e.target.value)} 
                  className="bg-white border-gray-200 text-[12px] py-1.5 font-medium text-[#172B4D] rounded-lg"
                />
              </div>
              <div className="flex flex-col w-48">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Search</p>
                <Input 
                  placeholder="Number or Authority" 
                  value={searchInput} 
                  onChange={(e) => setSearchInput(e.target.value)} 
                  className="bg-white border-gray-200 text-[12px] py-1.5 font-medium text-[#172B4D] rounded-lg"
                />
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors self-end mb-1"
            >
              Clear
            </button>
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
