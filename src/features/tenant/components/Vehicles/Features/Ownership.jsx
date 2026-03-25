import React, { useState, useMemo } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, Search,
  RefreshCw, Loader2, AlertCircle, Calendar,
  FileText, UserPlus, FileCheck, ArrowRightLeft,
  Link as LinkIcon
} from 'lucide-react';
import {
  useVehicleOwnership,
  useCreateVehicleOwnership,
  useUpdateVehicleOwnership,
  useDeleteVehicleOwnership,
} from '../../../queries/vehicles/vehicleInfoQuery';
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
  const isEdit = !!initial?.id && !isView;

  const resolveVehicleId = () => {
    if (vehicleId) return vehicleId;
    if (!initial?.vehicle) return '';
    if (typeof initial.vehicle === 'object') return initial.vehicle?.id ?? '';
    return initial.vehicle;
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
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
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

  const { data, isLoading, isError, error, refetch } = useVehicleOwnership({
    ...(search && { search }),
    ...(typeFilter && { transfer_type: typeFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
  });
  const del = useDeleteVehicleOwnership();

  const history = data?.results ?? data ?? [];

  return (
    <div className={`flex flex-col h-full bg-[#F4F5F7] ${isTab ? '' : 'p-6'}`}>
      {!isTab && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Ownership History</h1>
            <p className="text-sm text-gray-400 font-medium">Track transfers, leases and titles</p>
          </div>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm">
            <Plus size={14} /> Add Ownership Record
          </button>

        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 mt-2">
        {/* Compact Stats Row */}
        {!isTab && (
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Records:</span>
              <span className="text-[18px] font-black text-[#172B4D]">{history.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Latest Transfer:</span>
              <span className="text-[18px] font-black text-indigo-600">{history[0] ? fmtDate(history[0].transfer_date) : 'None'}</span>
            </div>
          </div>
        )}
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search records..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Sel className="w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {TRANSFER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Sel>
          </div>
          {isTab && (
            <button onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm italic ml-auto transition-all active:scale-95 text-nowrap leading-none">
              <Plus size={14} /> Add Record
            </button>
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
                  <tr key={h.id} className="hover:bg-blue-50/30 transition-colors group">
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
                        <button onClick={() => setModal({ mode: 'edit', data: h })} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
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
