import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#dc2626]/10 rounded-[12px] flex items-center justify-center border border-[#dc2626]/20 shadow-sm shadow-red-50">
            <span className="text-2xl">🚨</span>
          </div>
          <div>
            <h1 className="text-[26px] font-black text-[#1a202c] tracking-tight font-syne">Emergency Contacts</h1>
            <p className="text-[13px] text-[#64748b] mt-0.5 font-medium">Manage emergency contacts for all drivers — primary contact is notified first</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#0043A8] transition-all">
            <Plus size={16} /> Add Contact
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
        </div>

        {/* ── Filters Bar ── */}
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white flex-wrap gap-4">
          <div className="flex gap-3 items-center flex-wrap flex-1">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">🔍</span>
          <input 
            type="text"
            placeholder="Search contact name, driver name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-[12px] bg-[#f0f3f9] border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b7ef8]/10 focus:border-[#3b7ef8] transition-all placeholder:text-[#94a3b8] font-medium"
          />
        </div>

        {/* Driver Select */}
        <div className="min-w-[160px]">
          <DriverSelect 
            value={filters.driver} 
            onChange={(val) => handleFilterChange('driver', val)}
            className="rounded-lg border-[#e2e8f0] text-[12px] py-2 bg-[#f0f3f9] font-medium text-[#1a202c]"
          />
        </div>

        {/* Status Select */}
        <div className="min-w-[140px]">
          <select 
            value={filters.is_primary} 
            onChange={(e) => handleFilterChange('is_primary', e.target.value)}
            className="w-full px-3 py-2 text-[12px] bg-[#f0f3f9] border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b7ef8]/10 focus:border-[#3b7ef8] transition-all font-medium text-[#1a202c] appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">All Contacts</option>
            <option value="true">Primary Only</option>
            <option value="false">Secondary Only</option>
          </select>
        </div>

        {/* Relationship Select */}
        <div className="min-w-[140px]">
          <select 
            value={filters.relationship} 
            onChange={(e) => handleFilterChange('relationship', e.target.value)}
            className="w-full px-3 py-2 text-[12px] bg-[#f0f3f9] border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b7ef8]/10 focus:border-[#3b7ef8] transition-all font-medium text-[#1a202c] appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">All Relations</option>
            {relationships.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

          </div>
          <button 
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
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
