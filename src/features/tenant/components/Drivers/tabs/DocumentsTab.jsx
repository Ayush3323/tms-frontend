import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useUsers } from '../../../queries/users/userQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { useDriverDocuments } from '../../../queries/drivers/driverDocumentQuery';
import { useDriverLookup } from '../../../queries/drivers/driverCoreQuery';

import { LoadingState, ErrorState, EmptyState, TabLayoutShimmer } from '../common/StateFeedback';
import DocumentTable from '../sub-features/Documents/DocumentTable';
import { AddDocumentModal, EditDocumentModal, DeleteDocumentDialog } from '../sub-features/Documents/DocumentModals';

const DocumentsTab = ({ driverId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverDocuments(driverId);
  const { data: usersData } = useUsers({ page_size: 1000 });
  const { data: currentUser } = useCurrentUser();
  const driverMap = useDriverLookup();

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

  if (isLoading) return (
    <TabLayoutShimmer
      columns={[
        { headerWidth: 'w-24', cellWidth: 'w-28' }, // Driver
        { headerWidth: 'w-12', cellWidth: 'w-12', type: 'mono' }, // Emp ID
        { headerWidth: 'w-24', cellWidth: 'w-28', type: 'multiline' }, // Type
        { headerWidth: 'w-20', cellWidth: 'w-24', type: 'mono' }, // Number
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // Issue Date
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'mono' }, // Expiry Date
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Authority
        { headerWidth: 'w-16', cellWidth: 'w-20', type: 'badge' }, // Verification
        { headerWidth: 'w-20', cellWidth: 'w-24' }, // Verified By
        { headerWidth: 'w-28', cellWidth: 'w-32' }, // Verified At
        { headerWidth: 'w-16', cellWidth: 'w-20' }, // File
        { headerWidth: 'w-24', cellWidth: 'w-32' }, // Notes
        { headerWidth: 'w-10', cellWidth: 'w-14', align: 'right', type: 'action' }, // Actions
      ]}
    />
  );
  if (isError) return <ErrorState message="Failed to load documents" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen && <AddDocumentModal driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editDoc && <EditDocumentModal doc={editDoc} driverId={driverId} onClose={() => setEditDoc(null)} userMap={userMap} />}
      {deleteDoc && <DeleteDocumentDialog doc={deleteDoc} driverId={driverId} onClose={() => setDeleteDoc(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#172B4D] text-sm">Documents</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {documents.length} document{documents.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={14} /> Add Document
        </button>
      </div>

      {/* ── Empty State ── */}
      {documents.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Click Add Document to upload one"
        />
      )}

      {/* ── Table ── */}
      {documents.length > 0 && (
        <DocumentTable
          documents={documents}
          onEdit={setEditDoc}
          onDelete={setDeleteDoc}
          showDriver={false}
          driverMap={driverMap}
          userMap={userMap}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default DocumentsTab;