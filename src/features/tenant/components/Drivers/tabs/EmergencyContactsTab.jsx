import React, { useState } from 'react';
import { Plus, Phone } from 'lucide-react';
import { useDriverContacts } from '../../../queries/drivers/driverContactQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import ContactTable from '../sub-features/Contacts/ContactTable';
import { AddContactModal, EditContactModal, DeleteContactDialog } from '../sub-features/Contacts/ContactModals';

const EmergencyTab = ({ driverId }) => {
  const [addOpen,     setAddOpen]     = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [viewContact, setViewContact] = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverContacts(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const driverMap = useDriverLookup();
  const contacts = data?.results ?? [];

  const userMap = React.useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  if (isLoading) return (
    <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-28', cellWidth: 'w-32' }, // Name
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Relationship
        { headerWidth: 'w-24', cellWidth: 'w-32', type: 'badge' }, // Phone
        { headerWidth: 'w-24', cellWidth: 'w-32', type: 'badge' }, // Alt Phone
        { headerWidth: 'w-48', cellWidth: 'w-56' }, // Address
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Status
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError)   return <ErrorState message="Failed to load contacts" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen       && <AddContactModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editContact   && <EditContactModal contact={editContact} driverId={driverId} onClose={() => setEditContact(null)} />}
      {viewContact   && (
        <ViewContactModal 
          contact={viewContact} 
          driverName={driverMap[driverId]?.name} 
          employeeId={driverMap[driverId]?.employee_id}
          onClose={() => setViewContact(null)} 
        />
      )}
      {deleteContact && <DeleteContactDialog contact={deleteContact} driverId={driverId} onClose={() => setDeleteContact(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Emergency Contacts</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      {/* ── Empty State ── */}
      {contacts.length === 0 && (
        <EmptyState
          icon={Phone}
          title="No emergency contacts found"
          description="Click Add Contact to add one"
        />
      )}

      {/* ── Table ── */}
      {contacts.length > 0 && (
        <ContactTable 
          contacts={contacts} 
          onEdit={setEditContact} 
          onView={setViewContact}
          onDelete={setDeleteContact} 
          showDriver={false}
          driverMap={driverMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default EmergencyTab;