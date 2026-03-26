import React, { useState } from 'react';
import { Users, Plus, Search, RefreshCw, Download, Upload, X, RotateCcw } from 'lucide-react';
import { useEmergencyContacts } from '../../../queries/drivers/driverContactQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';
import { LoadingState, ErrorState, EmptyState, PageLayoutShimmer } from '../common/StateFeedback';
import ContactTable from '../sub-features/Contacts/ContactTable';
import { AddContactModal, EditContactModal, DeleteContactDialog } from '../sub-features/Contacts/ContactModals';
import DriverSelect from '../common/DriverSelect';
import Select from '../common/Select';

const AllContacts = () => {
  const [addOpen,       setAddOpen]       = useState(false);
  const [editContact,   setEditContact]   = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    driver: '',
    is_primary: '',
    relationship: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useEmergencyContacts(filters);
  const driverMap = useDriverLookup();
  const contacts = data?.results ?? [];

  // Extract unique relationships for the filter
  const relationships = React.useMemo(() => {
    const rs = new Set();
    contacts.forEach(c => { if (c.relationship) rs.add(c.relationship); });
    return Array.from(rs).sort();
  }, [contacts]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      driver: '',
      is_primary: '',
      relationship: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={4}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Driver
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32', type: 'bold' }, // Contact Name
        { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' }, // Relationship
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32', type: 'badge' }, // Phone
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32', type: 'badge' }, // Alt Phone
        { headerWidth: 'w-48', cellWidth: 'w-56', width: 'w-64' }, // Address
        { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-28', type: 'badge' }, // Status
        { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-24', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <div className="p-6"><ErrorState message="Failed to load contacts" error={error?.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      {/* ── Modals ── */}
      {addOpen       && <AddContactModal    driverId={null} onClose={() => setAddOpen(false)} />}
      {editContact   && <EditContactModal   contact={editContact} driverId={editContact.driver} onClose={() => setEditContact(null)} />}

      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        {/* ── Header ── */}
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Emergency Contacts</h1>
            <p className="text-gray-500 text-sm tracking-tight mt-0.5">Manage emergency contacts for all drivers</p>
          </div>
          <div className="flex-1" />
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
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Contacts:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{data?.count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Primary:</span>
                <span className="text-[18px] font-black text-green-600">{contacts.filter(c => c.is_primary).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Secondary:</span>
                <span className="text-[18px] font-black text-amber-600">{contacts.filter(c => !c.is_primary).length}</span>
              </div>
            </>
          )}
          <div className="ml-auto flex justify-end">
            <button onClick={() => setAddOpen(true)} className="bg-[#0052CC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-md active:scale-95 group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Contact
            </button>
          </div>
        </div>

        {/* ── Filters Bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 bg-white flex-wrap">
          <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)}
            className="text-xs py-1.5 font-medium text-[#172B4D] rounded-lg bg-gray-50 border-gray-100" />
          <select value={filters.is_primary} onChange={(e) => handleFilterChange('is_primary', e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-[#172B4D] focus:outline-none">
            <option value="">All Contacts</option>
            <option value="true">Primary Only</option>
            <option value="false">Secondary Only</option>
          </select>
          <select value={filters.relationship} onChange={(e) => handleFilterChange('relationship', e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-[#172B4D] focus:outline-none">
            <option value="">All Relations</option>
            {relationships.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search contact..." value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none font-medium text-[#172B4D]" />
          </div>
          {(filters.driver || filters.is_primary || filters.relationship || filters.search) && (
            <button onClick={clearFilters} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Clear Filters">
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 overflow-auto">
          {contacts.length === 0 ? (
          <div className="py-20">
            <EmptyState icon={Users} title="No contacts found" description="No emergency contacts have been added yet." />
          </div>
        ) : (
          <div className="p-4">
             <ContactTable contacts={contacts} onEdit={setEditContact} showDriver={true} driverMap={driverMap} />
          </div>
        )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AllContacts;
