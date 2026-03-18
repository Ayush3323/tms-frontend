import React, { useState } from 'react';
import { Plus, Phone } from 'lucide-react';
import { useDriverContacts } from '../../../queries/drivers/driverContactQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import ContactTable from '../sub-features/Contacts/ContactTable';
import { AddContactModal, EditContactModal, DeleteContactDialog } from '../sub-features/Contacts/ContactModals';

const EmergencyTab = ({ driverId }) => {
  const [addOpen,     setAddOpen]     = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverContacts(driverId);
  const contacts = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading contacts..." />;
  if (isError)   return <ErrorState message="Failed to load contacts" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen       && <AddContactModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editContact   && <EditContactModal contact={editContact} driverId={driverId} onClose={() => setEditContact(null)} />}
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
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all"
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
          onDelete={setDeleteContact} 
          showDriver={false}
        />
      )}
    </>
  );
};

export default EmergencyTab;