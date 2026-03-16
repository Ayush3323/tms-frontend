import React, { useState } from 'react';
import {
  Loader2, AlertCircle, Plus,
  Pencil, Trash2, FileText, RefreshCw,
  X, ChevronDown,
} from 'lucide-react';
import {
  useDriverDocuments,
  useCreateDriverDocument,
  useUpdateDriverDocument,
  useDeleteDriverDocument,
} from '../../../queries/drivers/driverDocumentQuery';

// ── Style Maps ────────────────────────────────────────────────────────

const VERIFICATION_STYLES = {
  VERIFIED: { text: 'text-green-700',  bg: 'bg-green-50 border border-green-200' },
  PENDING:  { text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  REJECTED: { text: 'text-red-700',    bg: 'bg-red-50 border border-red-200' },
  EXPIRED:  { text: 'text-gray-700',   bg: 'bg-gray-50 border border-gray-200' },
};

const DOCUMENT_TYPES    = ['AADHAR', 'PAN', 'LICENSE', 'PHOTO', 'ADDRESS_PROOF', 'EMPLOYMENT_LETTER', 'BACKGROUND_CHECK'];
const VERIFICATION_LIST = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'];

// ── Helpers ───────────────────────────────────────────────────────────

const getExpiryColor = (dateStr) => {
  if (!dateStr) return 'text-gray-400';
  const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'text-red-600 font-semibold';
  if (diffDays < 90) return 'text-orange-500 font-semibold';
  return 'text-green-600 font-semibold';
};

// ── Reusable Form Components ──────────────────────────────────────────

const Label = ({ children, required }) => (
  <label className="block text-xs font-bold text-gray-600 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props) => (
  <input {...props}
    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
      placeholder:text-gray-300 transition-all"
  />
);

const Sel = ({ children, ...props }) => (
  <div className="relative">
    <select {...props}
      className="w-full appearance-none px-3 pr-8 py-2 text-sm border border-gray-200
        rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20
        focus:border-[#0052CC] cursor-pointer transition-all">
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// ── MODALS START HERE ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Add Document Modal ────────────────────────────────────────────────
const AddDocumentModal = ({ driverId, onClose }) => {
  const [form, setForm] = useState({
    document_type:       '',
    document_number:     '',
    issue_date:          '',
    expiry_date:         '',
    issuing_authority:   '',
    file_url:            '',
    notes:               '',
    verification_status: 'PENDING',
  });
  const [error, setError] = useState('');
  const createDocument = useCreateDriverDocument(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.document_type)   return setError('Document type is required.');
    if (!form.document_number) return setError('Document number is required.');

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    createDocument.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add document.'),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Add Document</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a new document for this driver</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Document Type</Label>
              <Sel value={form.document_type} onChange={set('document_type')}>
                <option value="">Select type</option>
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Sel>
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
              <Sel value={form.verification_status} onChange={set('verification_status')}>
                {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
                placeholder:text-gray-300 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
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
        </div>
      </div>
    </div>
  );
};

// ── Edit Document Modal ───────────────────────────────────────────────
const EditDocumentModal = ({ doc, driverId, onClose }) => {
  const [form, setForm] = useState({
    document_type:       doc.document_type       ?? '',
    document_number:     doc.document_number     ?? '',
    issue_date:          doc.issue_date           ?? '',
    expiry_date:         doc.expiry_date          ?? '',
    issuing_authority:   doc.issuing_authority    ?? '',
    file_url:            doc.file_url             ?? '',
    notes:               doc.notes               ?? '',
    verification_status: doc.verification_status  ?? 'PENDING',
  });
  const [error, setError] = useState('');
  const updateDocument = useUpdateDriverDocument(driverId, doc.id);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.document_type)   return setError('Document type is required.');
    if (!form.document_number) return setError('Document number is required.');

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    updateDocument.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update document.'),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">Edit Document</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Editing: <span className="font-semibold text-gray-600">{doc.document_type_display ?? doc.document_type}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body — same fields as Add */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Document Type</Label>
              <Sel value={form.document_type} onChange={set('document_type')}>
                <option value="">Select type</option>
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Sel>
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
              <Sel value={form.verification_status} onChange={set('verification_status')}>
                {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Sel>
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
                placeholder:text-gray-300 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
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
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ── MODALS END HERE ───────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

// ── Delete Confirm Dialog ─────────────────────────────────────────────
const DeleteConfirm = ({ doc, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">Delete Document?</h3>
      <p className="text-sm text-gray-400 mb-5">
        <span className="font-semibold text-gray-600">{doc.document_type_display}</span> will be permanently deleted.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? <><Loader2 size={13} className="animate-spin" /> Deleting...</> : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Tab Component ────────────────────────────────────────────────
const DocumentsTab = ({ driverId }) => {
  const [addOpen,   setAddOpen]   = useState(false);
  const [editDoc,   setEditDoc]   = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const { data, isLoading, isError, error, refetch } = useDriverDocuments(driverId);
  const deleteDocument = useDeleteDriverDocument(driverId);
  const documents = data?.results ?? [];

  const handleDelete = () => {
    deleteDocument.mutate(deleteDoc.id, {
      onSuccess: () => setDeleteDoc(null),
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#0052CC]" />
      <span className="text-sm">Loading documents...</span>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
      <AlertCircle size={32} />
      <p className="text-sm font-medium">Failed to load documents</p>
      <p className="text-xs text-gray-400">{error?.message}</p>
      <button onClick={() => refetch()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">
        <RefreshCw size={13} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* ── Modals ── */}
      {addOpen    && <AddDocumentModal  driverId={driverId} onClose={() => setAddOpen(false)} />}
      {editDoc    && <EditDocumentModal doc={editDoc} driverId={driverId} onClose={() => setEditDoc(null)} />}
      {deleteDoc  && <DeleteConfirm doc={deleteDoc} onConfirm={handleDelete} onCancel={() => setDeleteDoc(null)} isDeleting={deleteDocument.isPending} />}

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
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-semibold">No documents found</p>
          <p className="text-xs mt-1">Click Add Document to upload one</p>
        </div>
      )}

      {/* ── Table ── */}
      {documents.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Document Type','Document Number','Issue Date','Expiry Date','Issuing Authority','Verification','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map(doc => {
                const vs = VERIFICATION_STYLES[doc.verification_status] ?? VERIFICATION_STYLES.PENDING;
                return (
                  <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                      {doc.document_type_display ?? doc.document_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {doc.document_number ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issue_date ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[12px] font-mono ${getExpiryColor(doc.expiry_date)}`}>
                        {doc.expiry_date ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issuing_authority ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit ${vs.bg} ${vs.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {doc.verification_status_display ?? doc.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditDoc(doc)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteDoc(doc)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default DocumentsTab;