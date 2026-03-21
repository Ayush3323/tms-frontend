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
    driver: '',
    is_primary: '',
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useEmergencyContacts(filters);
  const driverMap = useDriverLookup();
  const contacts = data?.results ?? [];

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      driver: '',
      is_primary: '',
    });
  };

  if (isLoading && !data) return (
    <PageLayoutShimmer
      filterCount={2}
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', width: 'w-24', type: 'mono' }, // Emp ID
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
    <div className="p-6 space-y-6">
      {/* ── Modals ── */}
      {addOpen       && <AddContactModal    driverId={null} onClose={() => setAddOpen(false)} />}
      {editContact   && <EditContactModal   contact={editContact} driverId={editContact.driver} onClose={() => setEditContact(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Emergency Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage emergency contacts for all drivers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] shadow-lg shadow-blue-200 transition-all active:scale-95">
            <Plus size={18} /> Add Contact
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Driver</p>
           <DriverSelect value={filters.driver} onChange={(val) => handleFilterChange('driver', val)} />
        </div>
        <div>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Primary Status</p>
           <Select value={filters.is_primary} onChange={(e) => handleFilterChange('is_primary', e.target.value)}>
             <option value="">All Contacts</option>
             <option value="true">Primary Only</option>
             <option value="false">Secondary Only</option>
           </Select>
        </div>
        <div className="flex items-end">
           <button 
             onClick={clearFilters}
             className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
           >
             Clear Filters
           </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
  );
};

export default AllContacts;
