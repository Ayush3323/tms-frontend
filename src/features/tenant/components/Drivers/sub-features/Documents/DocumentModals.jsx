import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, User, Clock } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateDriverDocument,
  useUpdateDriverDocument,
  useDeleteDriverDocument,
} from '../../../../queries/drivers/driverDocumentQuery';
import { useUsers } from '../../../../queries/users/userQuery';
import { useCurrentUser } from '../../../../queries/users/userActionQuery';
import DriverSelect from '../../common/DriverSelect';
import { DOCUMENT_TYPES, VERIFICATION_STATUS as VERIFICATION_LIST } from '../../common/constants';

// Shared Form Fields for Documents
const DocumentFormFields = ({ form, setForm, error, userMap = {}, onStatusChange, currentUser, isLoadingUsers }) => {
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  
  const handleStatusChange = (e) => {
    if (onStatusChange) {
      onStatusChange(e.target.value);
    } else {
      set('verification_status')(e);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Document Type</Label>
          <Select value={form.document_type} onChange={set('document_type')}>
            <option value="">Select type</option>
            {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label required>Document Number</Label>
          <Input placeholder="e.g. 1234 5678 9012" value={form.document_number} onChange={set('document_number')} />
        </div>
        <div><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={set('issue_date')} /></div>
        <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></div>
        <div><Label>Issuing Authority</Label><Input placeholder="e.g. UIDAI" value={form.issuing_authority} onChange={set('issuing_authority')} /></div>
        <div>
          <Label>Verification Status</Label>
          <Select value={form.verification_status} onChange={handleStatusChange}>
            {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {form.verification_status === 'VERIFIED' && form.verified_by && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight flex items-center gap-1">
              <User size={10} /> Verified By
            </span>
            <div className="text-[12px] font-semibold text-blue-700 min-h-[16px]">
              {isLoadingUsers && !userMap[form.verified_by] ? (
                <div className="h-3 bg-blue-200/50 rounded animate-pulse w-24 mt-0.5" />
              ) : (
                userMap[form.verified_by]?.name || 
                (form.verified_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) || 
                form.verified_by || 
                'System User'
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight flex items-center gap-1">
              <Clock size={10} /> Verified At
            </span>
            <div className="text-[12px] font-semibold text-blue-700 min-h-[16px]">
              {isLoadingUsers && !form.verified_at ? (
                <div className="h-3 bg-blue-200/50 rounded animate-pulse w-32 mt-0.5" />
              ) : (
                form.verified_at ? new Date(form.verified_at).toLocaleString() : '—'
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <Label>File URL</Label>
        <Input placeholder="https://example.com/files/doc.pdf" value={form.file_url} onChange={set('file_url')} />
      </div>
      <div>
        <Label>Notes</Label>
        <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 transition-all resize-none" />
      </div>
    </div>
  );
};

export const AddDocumentModal = ({ driverId, onClose }) => {
  const { data: currentUser } = useCurrentUser();
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    document_type: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    file_url: '',
    notes: '',
    verification_status: 'PENDING',
    verified_by: null,
    verified_at: null,
  });
  const [error, setError] = useState('');
  const createDocument = useCreateDriverDocument(targetDriverId);

  const handleStatusChange = (newStatus) => {
    setForm(p => {
      const updates = { verification_status: newStatus };
      if (newStatus === 'VERIFIED' && currentUser?.id) {
        updates.verified_by = currentUser.id;
        updates.verified_at = new Date().toISOString();
      } else if (newStatus !== 'VERIFIED') {
        updates.verified_by = null;
        updates.verified_at = null;
      }
      return { ...p, ...updates };
    });
  };

  const validate = () => {
    if (!targetDriverId) return 'Please select a driver.';
    if (!form.document_type) return 'Document type is required.';
    if (!form.document_number) return 'Document number is required.';
    if (form.issue_date && form.expiry_date && form.issue_date > form.expiry_date) {
      return 'Expiry date cannot be before issue date.';
    }
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    const payload = cleanObject(form);
    console.log('Creating Document with payload:', payload);

    createDocument.mutate(payload, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Document"
      description="Upload a new document"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.document_type || !form.document_number || createDocument.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createDocument.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Document</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!driverId && (
          <div>
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
          </div>
        )}
        <DocumentFormFields form={form} setForm={setForm} error={error} onStatusChange={handleStatusChange} currentUser={currentUser} />
      </div>
    </ModalWrapper>
  );
};

export const EditDocumentModal = ({ doc, driverId, onClose, userMap = {}, isLoadingUsers }) => {
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState({
    document_type: doc.document_type ?? '',
    document_number: doc.document_number ?? '',
    issue_date: doc.issue_date ?? '',
    expiry_date: doc.expiry_date ?? '',
    issuing_authority: doc.issuing_authority ?? '',
    file_url: doc.file_url ?? '',
    notes: doc.notes ?? '',
    verification_status: doc.verification_status ?? 'PENDING',
    verified_by: doc.verified_by ?? null,
    verified_at: doc.verified_at ?? null,
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateDocument = useUpdateDriverDocument(driverId, doc.id);
  const deleteDocument = useDeleteDriverDocument(driverId);

  const handleStatusChange = (newStatus) => {
    setForm(p => {
      const updates = { verification_status: newStatus };
      if (newStatus === 'VERIFIED' && currentUser?.id) {
        updates.verified_by = currentUser.id;
        updates.verified_at = new Date().toISOString();
      } else if (newStatus !== 'VERIFIED') {
        updates.verified_by = null;
        updates.verified_at = null;
      }
      return { ...p, ...updates };
    });
  };

  const validate = () => {
    if (!form.document_type) return 'Document type is required.';
    if (!form.document_number) return 'Document number is required.';
    if (form.issue_date && form.expiry_date && form.issue_date > form.expiry_date) {
      return 'Expiry date cannot be before issue date.';
    }
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    const payload = cleanObject(form);
    console.log('Updating Document with payload:', payload);

    updateDocument.mutate(payload, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Document"
      description={<span>Editing: <span className="font-semibold text-gray-600">{doc.document_type_display ?? doc.document_type}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Document
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.document_type || !form.document_number || updateDocument.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateDocument.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Document</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Document?"
          description="This document will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteDocument.mutate(doc.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteDocument.isPending}
        />
      )}
      <DocumentFormFields 
        form={form} 
        setForm={setForm} 
        error={error} 
        userMap={userMap} 
        onStatusChange={handleStatusChange} 
        currentUser={currentUser}
        isLoadingUsers={isLoadingUsers}
      />
    </ModalWrapper>
  );
};

export const DeleteDocumentDialog = ({ doc, driverId, onClose }) => {
  const deleteMutation = useDeleteDriverDocument(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(doc.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Document?"
      description={<p><span className="font-semibold text-gray-600">{doc.document_type_display || doc.document_type}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
