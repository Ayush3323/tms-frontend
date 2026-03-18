import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useDriverDocuments } from '../../../queries/drivers/driverDocumentQuery';

import { LoadingState, ErrorState, EmptyState } from '../common/StateFeedback';
import DocumentTable from '../sub-features/Documents/DocumentTable';
import { AddDocumentModal, EditDocumentModal, DeleteDocumentDialog } from '../sub-features/Documents/DocumentModals';

const DocumentsTab = ({ driverId }) => {
  const [addOpen,   setAddOpen]   = useState(false);
  const [editDoc,   setEditDoc]   = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverDocuments(driverId);
  const documents = data?.results ?? [];

  if (isLoading) return <LoadingState message="Loading documents..." />;
  if (isError)   return <ErrorState message="Failed to load documents" error={error?.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* ── Modals ── */}
      {addOpen    && <AddDocumentModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editDoc    && <EditDocumentModal doc={editDoc} driverId={driverId} onClose={() => setEditDoc(null)} />}
      {deleteDoc  && <DeleteDocumentDialog doc={deleteDoc} driverId={driverId} onClose={() => setDeleteDoc(null)} />}

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
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all"
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
        />
      )}
    </>
  );
};

export default DocumentsTab;