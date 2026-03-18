import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject } from '../../common/utils';
import {
  useCreateDriverDocument,
  useUpdateDriverDocument,
  useDeleteDriverDocument,
} from '../../../../queries/drivers/driverDocumentQuery';
import DriverSelect from '../../common/DriverSelect';
import { DOCUMENT_TYPES, VERIFICATION_STATUS as VERIFICATION_LIST } from '../../common/constants';

export const AddDocumentModal = ({ driverId, onClose }) => {
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
  });
  const [error, setError] = useState('');
  const createDocument = useCreateDriverDocument(targetDriverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!targetDriverId) return setError('Please select a driver.');
    if (!form.document_type) return setError('Document type is required.');
    if (!form.document_number) return setError('Document number is required.');

    createDocument.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add document.'),
    });
  };

  return (
    <ModalWrapper
      title="Add Document"
      description="Upload a new document"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.document_type || !form.document_number || createDocument.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createDocument.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Plus size={14} /> Add Document</>
            }
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        
        {/* Driver Selection (Only visible if driverId is not provided) */}
        {!driverId && (
          <div>
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
          </div>
        )}

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
          <div>
            <Label>Issue Date</Label>
            <Input type="date" value={form.issue_date} onChange={set('issue_date')} />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Issuing Authority</Label>
            <Input placeholder="e.g. UIDAI" value={form.issuing_authority} onChange={set('issuing_authority')} />
          </div>
          <div>
            <Label>Verification Status</Label>
            <Select value={form.verification_status} onChange={set('verification_status')}>
              {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label>File URL</Label>
          <Input placeholder="https://example.com/files/doc.pdf" value={form.file_url} onChange={set('file_url')} />
        </div>
        <div>
          <Label>Notes</Label>
          <textarea
            rows={2} placeholder="Any additional notes..."
            value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 transition-all resize-none"
          />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditDocumentModal = ({ doc, driverId, onClose }) => {
  const [form, setForm] = useState({
    document_type: doc.document_type ?? '',
    document_number: doc.document_number ?? '',
    issue_date: doc.issue_date ?? '',
    expiry_date: doc.expiry_date ?? '',
    issuing_authority: doc.issuing_authority ?? '',
    file_url: doc.file_url ?? '',
    notes: doc.notes ?? '',
    verification_status: doc.verification_status ?? 'PENDING',
  });
  const [error, setError] = useState('');
  const updateDocument = useUpdateDriverDocument(driverId, doc.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.document_type) return setError('Document type is required.');
    if (!form.document_number) return setError('Document number is required.');

    updateDocument.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update document.'),
    });
  };

  return (
    <ModalWrapper
      title="Edit Document"
      description={<span>Editing: <span className="font-semibold text-gray-600">{doc.document_type_display ?? doc.document_type}</span></span>}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.document_type || !form.document_number || updateDocument.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateDocument.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Pencil size={14} /> Update Document</>
            }
          </button>
        </>
      }
    >
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
          <div>
            <Label>Issue Date</Label>
            <Input type="date" value={form.issue_date} onChange={set('issue_date')} />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
          </div>
          <div>
            <Label>Issuing Authority</Label>
            <Input placeholder="e.g. UIDAI" value={form.issuing_authority} onChange={set('issuing_authority')} />
          </div>
          <div>
            <Label>Verification Status</Label>
            <Select value={form.verification_status} onChange={set('verification_status')}>
              {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label>File URL</Label>
          <Input placeholder="https://example.com/files/doc.pdf" value={form.file_url} onChange={set('file_url')} />
        </div>
        <div>
          <Label>Notes</Label>
          <textarea
            rows={2} placeholder="Any additional notes..."
            value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 transition-all resize-none"
          />
        </div>
      </div>
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
