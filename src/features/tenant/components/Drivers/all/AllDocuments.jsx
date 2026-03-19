import React, { useState } from 'react';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { useDocuments } from '../../../queries/drivers/driverDocumentQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import DocumentTable from '../sub-features/Documents/DocumentTable';
import { AddDocumentModal, EditDocumentModal, DeleteDocumentDialog } from '../sub-features/Documents/DocumentModals';
import DriverSelect from '../common/DriverSelect';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
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

  if (isLoading && !data) return <div className="p-6"><LoadingState message="Loading all driver documents..." /></div>;
  if (isError) return <div className="p-6"><ErrorState message="Failed to load documents" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen && <AddDocumentModal driverId={null} onClose={() => setAddOpen(false)} />}
      {editDoc && <EditDocumentModal doc={editDoc} driverId={editDoc.driver} onClose={() => setEditDoc(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Driver Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all documents across all registered drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Document
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
          <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Doc Type</p>
          <Select value={filters.document_type} onChange={(e) => handleFilterChange('document_type', e.target.value)}>
            <option value="">All Types</option>
            {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</p>
          <Select value={filters.verification_status} onChange={(e) => handleFilterChange('verification_status', e.target.value)}>
            <option value="">All Status</option>
            {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</p>
          <Input type="date" value={filters.expiry_date} onChange={(e) => handleFilterChange('expiry_date', e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Search</p>
            <Input placeholder="Number or Authority" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDocuments;
