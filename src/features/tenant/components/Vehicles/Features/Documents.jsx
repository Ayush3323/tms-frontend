import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Plus, Eye, X, Search, RotateCcw,
  Loader2, AlertCircle, CheckCircle, XCircle, Clock, AlertTriangle,
  Download, Upload, Calendar, Pencil, Trash2, ChevronDown
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
  fmtDate, fmtINR
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

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
  const [currentPage, setCurrentPage] = useState(1);

  const del = useDeleteVehicleDocument();

  const { data, isLoading, isError, error, refetch } = useVehicleDocuments({
    ...(vehicleId && { vehicle: vehicleId }),
    ...(typeFilter && { document_type: typeFilter }),
    ...(search && { search }),
    expand: 'vehicle',
    page: currentPage,
  });

  const docs = data?.results ?? data ?? [];
  const total = data?.count ?? docs.length;
  // Use API status field directly
  const valid = docs.filter(d => d.status === 'VALID').length;
  const expiring = docs.filter(d => d.status === 'EXPIRING_SOON').length;
  const expired = docs.filter(d => d.status === 'EXPIRED').length;

  const content = (
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>

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
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Documents</h2>
            <p className="text-gray-500 text-sm tracking-tight">RC, Insurance, PUC, Fitness</p>
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                  title="Clear search"
                >
                  <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 ml-auto">
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
              >
                <RotateCcw size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95">
                <Download size={14} />
                <span>Export</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95">
                <Upload size={14} />
                <span>Import</span>
              </button>
            </div>
            <div className="w-px h-8 bg-gray-200 mx-1" />
          </div>
        </div>
      )}

      {/* Table / List Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Compact Stats Row */}
        {!isTab && (
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                  <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Valid:</span>
                  <span className="text-[18px] font-black text-emerald-600">{valid}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expiring:</span>
                  <span className="text-[18px] font-black text-orange-500">{expiring}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Expired:</span>
                  <span className="text-[18px] font-black text-red-600">{expired}</span>
                </div>
              </>
            )}
            <div className="ml-auto w-1/4 flex justify-end">
              <button
                onClick={() => setModal('add')}
                className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Document</span>
              </button>
            </div>
          </div>
        )}


        <div>
        {/* Filters & Pagination Row */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
          <div className="flex items-center gap-6">
            {isTab && (
              <div className="relative w-64 text-gray-400">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search number..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10 text-[#172B4D] font-medium"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Types</option>
                {DOC_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {typeFilter && (
              <button
                onClick={() => setType('')}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Previous
            </button>

            <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
              {currentPage}
            </div>

            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!data?.next || isLoading}
              className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              Next
            </button>
          </div>
        </div>
        </div>

        {isLoading && <TabContentShimmer />}

        {isError && <ErrorState message="Failed to load documents" error={error?.message} onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm relative">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  {!vehicleId && <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>}
                  {['Doc Type', 'Doc Number', 'Expiry Date', 'Status', 'Actions'].map(h => (
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
                            className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
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

                      {/* Expiry Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-gray-500 text-[12px]">
                          <Calendar size={11} className="text-gray-300" />{fmtDate(doc.expiry_date)}
                        </span>
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
