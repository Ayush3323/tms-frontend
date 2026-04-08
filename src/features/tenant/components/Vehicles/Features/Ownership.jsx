import React, { useState, useMemo } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, Search,
  RotateCcw, Loader2, AlertCircle, Calendar,
  FileText, UserPlus, FileCheck, ArrowRightLeft,
  Link as LinkIcon, Download, Upload, ChevronDown
} from 'lucide-react';
import {
  useVehicleOwnership,
  useCreateVehicleOwnership,
  useUpdateVehicleOwnership,
  useDeleteVehicleOwnership,
  useVehicleOwnershipItem,
} from '../../../queries/vehicles/vehicleInfoQuery';
import { useVehicles } from '../../../queries/vehicles/vehicleQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtINR
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

// ─── Constants ────────────────────────────────────────────────────────────────
const TRANSFER_TYPE_OPTIONS = [
  { value: 'LEASE_START', label: 'Lease Start' },
  { value: 'LEASE_END', label: 'Lease End' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SALE', label: 'Sale' },
  { value: 'INTERNAL', label: 'Internal Transfer' },
  { value: 'OTHER', label: 'Other' },
];

const TRANSFER_COLORS = {
  LEASE_START: 'bg-blue-50 text-blue-700 border-blue-200',
  LEASE_END: 'bg-gray-100 text-gray-700 border-gray-200',
  PURCHASE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SALE: 'bg-red-50 text-red-700 border-red-200',
  INTERNAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-100',
};

const EMPTY_FORM = {
  vehicle: '', previous_owner: '', new_owner: '',
  transfer_date: '', transfer_type: '',
  transfer_document_url: '', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FormSec = ({ title }) => (
  <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest pt-2 pb-1 border-b border-blue-50 mb-2">
    {title}
  </p>
);


// ─── Components ───────────────────────────────────────────────────────────────
const ViewDetail = ({ data, onClose }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-6">
      <InfoCard label="Transfer Type" value={data.transfer_type_display ?? data.transfer_type} />
      <InfoCard label="Transfer Date" value={fmtDate(data.transfer_date)} icon={Calendar} />
      <InfoCard label="Previous Owner" value={data.previous_owner || 'Initial Registration'} />
      <InfoCard label="New Owner" value={data.new_owner || '—'} />
    </div>

    {data.transfer_document_url && (
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Transfer Document</p>
        <a
          href={data.transfer_document_url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm">
          <FileText size={14} /> View Document
        </a>
      </div>
    )}

    {data.notes && (
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Notes</p>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">{data.notes}</p>
      </div>
    )}
  </div>
);

const OwnershipModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
  // Force browser reload comment: v2
  const isEdit = !!initial?.id && !isView;

  // FETCH FULL DATA IF EDIT (to get missing vehicle ID from the list response)
  const { data: fullData } = useVehicleOwnershipItem(initial?.id, {
    enabled: isEdit && !vehicleId && (!initial?.vehicle || typeof initial?.vehicle !== 'object'),
    expand: 'vehicle'
  });

  // Backup: Manual mapping via vehicle list
  const { data: vData } = useVehicles({ all: true }, { enabled: isEdit && !vehicleId });
  const allVehicles = vData?.results ?? vData ?? [];

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (typeof initial?.vehicle === 'object' && initial.vehicle !== null) return initial.vehicle.id || '';
    if (initial?.vehicle_id) return initial.vehicle_id;

    // Attempt manual match by registration string
    const reg = initial?.vehicle_registration_number || initial?.vehicle_registration || initial?.vehicle || '';
    if (reg && allVehicles.length > 0) {
      const norm = (s) => String(s || '').replace(/\s+/g, '').toUpperCase();
      const match = allVehicles.find(v => norm(v.registration_number) === norm(reg));
      if (match) return match.id;
    }
    return '';
  };

  const [form, setForm] = useState(
    initial ? {
      vehicle: resolveVehicleId(),
      previous_owner: initial.previous_owner ?? '',
      new_owner: initial.new_owner ?? '',
      transfer_date: initial.transfer_date ?? '',
      transfer_type: initial.transfer_type ?? '',
      transfer_document_url: initial.transfer_document_url ?? '',
      notes: initial.notes ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleOwnership();
  const update = useUpdateVehicleOwnership();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Sync vehicle ID when full data or vehicle list is fetched
  React.useEffect(() => {
    if (isEdit && !form.vehicle && allVehicles.length > 0) {
      const reg = initial?.vehicle_registration_number || initial?.vehicle_registration || initial?.vehicle || '';
      if (reg) {
        const norm = (s) => String(s || '').replace(/\s+/g, '').toUpperCase();
        const match = allVehicles.find(v => norm(v.registration_number) === norm(reg));
        if (match) setForm(p => ({ ...p, vehicle: match.id }));
      }
    }
    if (fullData) {
      const vId = fullData.vehicle?.id || fullData.vehicle || fullData.vehicle_id || '';
      if (vId && !form.vehicle) {
        setForm(p => ({ ...p, vehicle: vId }));
      }
    }
  }, [allVehicles, fullData, isEdit, initial, form.vehicle]);

  const handleSubmit = () => {
    const clean = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Ownership Details' : isEdit ? 'Edit Record' : 'Add Record'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {isView ? (
          <ViewDetail data={initial} onClose={onClose} />
        ) : (
          <>
            <FormSec title="Vehicle & Transfer Detail" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect
                    value={form.vehicle}
                    disabled={isEdit}
                    placeholder={initial?.vehicle_registration_number || initial?.vehicle_registration || initial?.vehicle_display}
                    onChange={(id) => setForm(p => ({ ...p, vehicle: id }))}
                  />
                </div>
              )}
              <Field label="Transfer Type" required>
                <Sel value={form.transfer_type} onChange={set('transfer_type')}>
                  <option value="">Select type</option>
                  {TRANSFER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Sel>
              </Field>
              <Field label="Transfer Date" required>
                <Input type="date" value={form.transfer_date} onChange={set('transfer_date')} />
              </Field>
            </div>

            <FormSec title="Owner Information" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Previous Owner">
                <Input placeholder="e.g. Acme Corp" value={form.previous_owner} onChange={set('previous_owner')} />
              </Field>
              <Field label="New Owner" required>
                <Input placeholder="e.g. Zenith Fleet" value={form.new_owner} onChange={set('new_owner')} />
              </Field>
            </div>

            <FormSec title="Documentation" />
            <Field label="Document URL">
              <Input placeholder="Link to document (PDF, Image)" value={form.transfer_document_url} onChange={set('transfer_document_url')} />
            </Field>

            <Field label="Notes">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Transfer conditions, terms..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

const VehicleOwnership = ({ vehicleId, isTab }) => {
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useVehicleOwnership({
    ...(search && { search }),
    ...(typeFilter && { transfer_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
    expand: 'vehicle',
    page: currentPage,
  });
  const del = useDeleteVehicleOwnership();

  const history = data?.results ?? data ?? [];

  return (
    <div className={`flex flex-col h-full ${isTab ? '' : 'p-6 bg-[#f8fafc] flex-1 min-h-0 overflow-hidden relative font-sans text-slate-900'}`}>
      {!isTab && (
        <div className="flex items-center mb-8">
          <div className="w-1/4">
            <h2 className="text-2xl font-bold text-[#172B4D]">Ownership</h2>
            <p className="text-gray-500 text-sm tracking-tight">Transfers, leases and title history</p>
          </div>
          <div className="flex-1 max-w-2xl px-8">
            <div className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
              <input
                type="text"
                placeholder="Search records..."
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 mt-2 overflow-hidden">
        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Records:</span>
            <span className="text-[18px] font-black text-[#172B4D]">{history.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Latest Transfer:</span>
            <span className="text-[18px] font-black text-indigo-600">{history[0] ? fmtDate(history[0].transfer_date) : 'None'}</span>
          </div>
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Filters & Pagination Row */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
          <div className="flex items-center gap-6">
            {isTab && (
              <div className="relative w-64 text-gray-400">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search records..."
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
                onChange={e => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Types</option>
                {TRANSFER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {typeFilter && (
              <button
                onClick={() => setTypeFilter('')}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
          {!isTab && (
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
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <TabContentShimmer />
          ) : isError ? (
            <ErrorState message="Failed to load ownership history" error={error?.message} onRetry={() => refetch()} />
          ) : !history.length ? (
            <EmptyState icon={Users} text="No ownership records found" onAdd={() => setModal({ mode: 'add' })} />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
                <tr className="border-b border-gray-100">
                  {!vehicleId && <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>}
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Transfer Info</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setViewing(h)}>
                    {!vehicleId && (
                      <td className="px-5 py-4 text-sm font-medium text-gray-600 truncate max-w-[150px]">
                        <button onClick={() => setViewing(h)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                          {h.vehicle_registration_number ?? h.vehicle_registration ?? h.vehicle_display ?? h.vehicle ?? '—'}
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge className={TRANSFER_COLORS[h.transfer_type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
                        {h.transfer_type_display ?? h.transfer_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-tight mb-0.5">New Owner</p>
                          <p className="text-sm font-black text-[#172B4D]">{h.new_owner || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <Calendar size={12} className="text-gray-400" />
                        {fmtDate(h.transfer_date)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', data: h }); }} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <OwnershipModal
          initial={modal.data}
          onClose={() => setModal(null)}
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <OwnershipModal
          initial={viewing}
          onClose={() => setViewing(null)}
          isView
          vehicleId={vehicleId}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label="Record"
          onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending}
        />
      )}
    </div>
  );
};

export default VehicleOwnership;
