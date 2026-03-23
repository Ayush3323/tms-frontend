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
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddDocumentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editDoc && <EditDocumentModal doc={editDoc} driverId={editDoc.driver} onClose={() => setEditDoc(null)} userMap={userMap} isLoadingUsers={isLoadingUsers} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Driver Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all documents across all registered drivers</p>
        </div>
         <div className="flex items-center gap-3">
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Add Document
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect 
            value={filters.driver} 
            onChange={(val) => handleFilterChange('driver', val)} 
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Doc Type</p>
          <Select 
            value={filters.document_type} 
            onChange={(e) => handleFilterChange('document_type', e.target.value)}
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
          <Select 
            value={filters.verification_status} 
            onChange={(e) => handleFilterChange('verification_status', e.target.value)}
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          >
            <option value="">All Status</option>
            {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</p>
          <Input 
            type="date" 
            value={filters.expiry_after} 
            onChange={(e) => handleFilterChange('expiry_after', e.target.value)} 
            className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Search</p>
            <Input 
              placeholder="Number or Authority" 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              className="bg-[#f0f3f9] border-[#e2e8f0] text-[12px] py-1.5 font-medium text-[#1a202c] rounded-lg"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {documents.length === 0 ? (
          <div className="py-20">
            <EmptyState
              icon={FileText}
              title="No documents found"
              description="There are no documents uploaded for any driver yet."
            />
          </div>
        ) : (
          <div className="p-4">
            <DocumentTable
              documents={documents}
              onEdit={setEditDoc}
              showDriver={true}
              driverMap={driverMap}
              userMap={userMap}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDocuments;
