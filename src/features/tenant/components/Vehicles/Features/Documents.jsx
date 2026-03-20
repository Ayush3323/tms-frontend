import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, RefreshCw, Loader2, AlertCircle, X,
  ChevronDown, FileText, Search, Pencil, Trash2,
  CheckCircle, Clock, AlertTriangle, Calendar
} from 'lucide-react';
import {
  useVehicleDocuments,
  useCreateVehicleDocument,
  useUpdateVehicleDocument,
  useDeleteVehicleDocument,
} from '../../../queries/vehicles/vehicleInfoQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Section, Field, StatCard, Textarea, VehicleSelect,
  fmtDate
} from '../Common/VehicleCommon';

// ── Constants ─────────────────────────────────────────────────────────
const DOC_TYPES = ['RC', 'INSURANCE', 'PUC', 'FITNESS', 'PERMIT', 'TAX'];

const DOC_TYPE_COLORS = {
  RC: 'bg-blue-50 text-blue-600 border-blue-200',
  INSURANCE: 'bg-purple-50 text-purple-600 border-purple-200',
  PUC: 'bg-green-50 text-green-600 border-green-200',
  FITNESS: 'bg-orange-50 text-orange-600 border-orange-200',
  PERMIT: 'bg-teal-50 text-teal-600 border-teal-200',
  TAX: 'bg-pink-50 text-pink-600 border-pink-200',
};

// API returns status: VALID | EXPIRED | EXPIRING_SOON
const STATUS_STYLES = {
  VALID: { label: 'Valid', color: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-500' },
  EXPIRED: { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
  EXPIRING_SOON: { label: 'Expiring', color: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
};

const EMPTY_FORM = {
  vehicle: '',
  document_type: '',
  document_number: '',
  issue_date: '',
  expiry_date: '',
  issuing_authority: '',
  notes: '',
};

// ── Field components ──────────────────────────────────────────────────

// ── Vehicle Searchable Dropdown ───────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────

// ─── Detail View ─────────────────────────────────────────────────────────────
const DocDetailView = ({ data, onClose }) => {
  const st = STATUS_STYLES[data.status] ?? STATUS_STYLES.VALID;
  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Document Type</p>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${DOC_TYPE_COLORS[data.document_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {data.document_type}
          </span>
          {data.document_type_display && (
            <div className="text-[11px] text-gray-400 mt-0.5">{data.document_type_display}</div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</p>
          <p className="text-sm font-bold text-[#172B4D] font-mono">
            {typeof data.vehicle === 'object'
              ? (data.vehicle?.registration_number ?? '—')
              : (data.vehicle_registration_number ?? data.vehicle_registration ?? data.vehicle_display ?? data.vehicle ?? '—')}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Document Number</p>
          <p className="text-sm font-black text-[#172B4D] font-mono">{data.document_number || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
          <p className="text-sm text-gray-600 font-semibold">{fmtDate(data.issue_date)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry Date</p>
          <p className="text-sm text-gray-600 font-semibold">{fmtDate(data.expiry_date)}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issuing Authority</p>
        <p className="text-sm text-gray-600 font-medium">{data.issuing_authority || '—'}</p>
      </div>

      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 min-h-[80px]">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes || 'No extra notes provided.'}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0052CC] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
          Close
        </button>
      </div>
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────
const DocModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  const isEdit = !!initial?.id && !isView;

  // Resolve vehicle id from initial or prop
  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (!initial?.vehicle) return '';
    if (typeof initial.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial.vehicle;
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      document_type: initial.document_type ?? '',
      document_number: initial.document_number ?? '',
      issue_date: initial.issue_date ?? '',
      expiry_date: initial.expiry_date ?? '',
      issuing_authority: initial.issuing_authority ?? '',
      notes: initial.notes ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleDocument();
  const update = useUpdateVehicleDocument();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const errs = {};
    if (form.issue_date && form.expiry_date && new Date(form.expiry_date) <= new Date(form.issue_date)) {
      errs.expiry_date = 'Must be after issue date';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});

    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Document Details' : isEdit ? 'Edit Document' : 'Add Document'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
    >
      <div className="space-y-4">
        {isView ? (
          <DocDetailView data={initial} onClose={onClose} />
        ) : (
          <>
            {!vehicleId && (
              <Field label="Vehicle" required={!isEdit}>
                <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
                {isEdit && !form.vehicle && (
                  <p className="text-[11px] text-orange-500 mt-1">⚠ Vehicle info not available in API — will be preserved on update</p>
                )}
              </Field>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Document Type" required>
                <Sel value={form.document_type} onChange={set('document_type')}>
                  <option value="">Select type</option>
                  {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </Sel>
              </Field>
              <Field label="Document Number" required>
                <Input placeholder="e.g. RCMH12AB1234" value={form.document_number} onChange={set('document_number')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Issue Date"><Input type="date" value={form.issue_date} onChange={set('issue_date')} /></Field>
              <Field label="Expiry Date" error={errors.expiry_date}><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></Field>
            </div>
            <Field label="Issuing Authority"><Input placeholder="e.g. RTO Mumbai" value={form.issuing_authority} onChange={set('issuing_authority')} /></Field>
            <Field label="Notes">
              <Textarea value={form.notes ?? ''} onChange={set('notes')} rows={3} placeholder="Any additional notes..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};


// ── Main Page ─────────────────────────────────────────────────────────
const VehicleDocuments = ({ vehicleId, isTab }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setType] = useState('');
  const [modal, setModal] = useState(null);
  const [viewTarget, setView] = useState(null);
  const [deleteTarget, setDelete] = useState(null);

  const del = useDeleteVehicleDocument();

  const { data, isLoading, isError, error, refetch } = useVehicleDocuments({
    ...(vehicleId && { vehicle: vehicleId }),
    ...(typeFilter && { document_type: typeFilter }),
    ...(search && { search }),
    expand: 'vehicle',
  });

  const docs = data?.results ?? data ?? [];
  const total = data?.count ?? docs.length;
  // Use API status field directly
  const valid = docs.filter(d => d.status === 'VALID').length;
  const expiring = docs.filter(d => d.status === 'EXPIRING_SOON').length;
  const expired = docs.filter(d => d.status === 'EXPIRED').length;

  const content = (
    <div className={!isTab ? "p-6 space-y-6 bg-[#F8FAFC] min-h-screen" : "space-y-4"}>

      {(modal === 'add' || (modal && modal !== 'add')) && (
        <DocModal vehicleId={vehicleId} initial={modal === 'add' ? null : modal} onClose={() => setModal(null)} onDeleteRequest={() => { setModal(null); setDelete(modal); }} />
      )}
      {viewTarget && (
        <DocModal vehicleId={vehicleId} initial={viewTarget} isView onClose={() => setView(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirm label="Document" onClose={() => setDelete(null)}
          onConfirm={() => del.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={del.isPending} />
      )}

      {/* Header — hidden in tab mode */}
      {!isTab && (
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Documents</h1>
            <p className="text-sm text-gray-400 mt-0.5">RC, Insurance, PUC, Fitness, Permit, Tax records</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm">
              <Plus size={15} /> Add Document
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards — hidden in tab mode */}
      {!isTab && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard loading={isLoading} label="Total" value={total} icon={FileText} color="blue" />
          <StatCard loading={isLoading} label="Valid" value={valid} icon={CheckCircle} color="green" />
          <StatCard loading={isLoading} label="Expiring" value={expiring} icon={Clock} color="orange" />
          <StatCard loading={isLoading} label="Expired" value={expired} icon={AlertTriangle} color="red" />
        </div>
      )}

      {/* Table / List Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isTab ? (
          <SectionHeader icon={FileText} title="Documents" count={docs.length} onAdd={() => setModal('add')} addLabel="Add Document" />
        ) : (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#172B4D]">📄 Document Registry</h2>
              <p className="text-xs text-gray-400 mt-0.5">All vehicle compliance documents</p>
            </div>
            <button onClick={() => setModal('add')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">
              <Plus size={14} /> Add Document
            </button>
          </div>
        )}

        {/* Filters — usually hidden in tab mode unless requested, but search is nice */}
        <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap ${isTab ? 'bg-gray-50/30' : ''}`}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search number..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>
          <div className="relative">
            <select value={typeFilter} onChange={e => setType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Types</option>
              {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {!isTab && (
            <button onClick={() => { setSearch(''); setType(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
              <RefreshCw size={13} /> Reset
            </button>
          )}
        </div>

        {isLoading && <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><Loader2 size={20} className="animate-spin text-[#0052CC]" /><span className="text-sm">Loading documents...</span></div>}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">Failed to load documents</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg">Try Again</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                  {['Doc Type', 'Doc Number', 'Issue Date', 'Expiry Date', 'Issuing Authority', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => {
                  const st = STATUS_STYLES[doc.status] ?? STATUS_STYLES.VALID;
                  return (
                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">

                      {/* Vehicle — hidden if vehicleId is prop */}
                      {!vehicleId && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button onClick={() => setView(doc)}
                            className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-colors text-left uppercase">
                            {typeof doc.vehicle === 'object'
                              ? (doc.vehicle?.registration_number ?? '—')
                              : (doc.vehicle_registration_number ?? doc.vehicle_registration ?? doc.vehicle_display ?? doc.vehicle ?? '—')}
                          </button>
                        </td>
                      )}

                      {/* Doc Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${DOC_TYPE_COLORS[doc.document_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {doc.document_type}
                          </span>
                          {doc.document_type_display && (
                            <div className="text-[11px] text-gray-400 mt-0.5">{doc.document_type_display}</div>
                          )}
                        </div>
                      </td>

                      {/* Doc Number */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#172B4D] text-[13px]">{doc.document_number ?? '—'}</span>
                      </td>

                      {/* Issue Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={11} className="text-gray-300" />{fmtDate(doc.issue_date)}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={11} className="text-gray-300" />{fmtDate(doc.expiry_date)}
                        </span>
                      </td>

                      {/* Issuing Authority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-600 text-[12px] font-medium">{doc.issuing_authority ?? '—'}</span>
                      </td>

                      {/* Status — from API directly */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={st.color}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal(doc)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {docs.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No documents found</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing <span className="font-bold text-gray-600">{docs.length}</span>{data?.count && data.count !== docs.length && <> of <span className="font-bold text-gray-600">{data.count}</span></>} documents</span>
            {!isTab && <span className="text-[11px]">Fleet Management System</span>}
          </div>
        )}
      </div>
    </div>
  );

  return content;
};

export default VehicleDocuments;
