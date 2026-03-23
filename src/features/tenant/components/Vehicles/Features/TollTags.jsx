import React, { useState, useMemo } from 'react';
import {
  Tag, Plus, Edit2, Trash2, X, Search,
  RefreshCw, Loader2, CreditCard, Building2,
  Calendar, Hash, FileText, CheckCircle, XCircle,
  IndianRupee
} from 'lucide-react';
import {
  useVehicleTollTags,
  useCreateVehicleTollTag,
  useUpdateVehicleTollTag,
  useDeleteVehicleTollTag,
} from '../../../queries/vehicles/vehicleInfoQuery';
import { useVehicles } from '../../../queries/vehicles/vehicleQuery';
import {
  Badge, InfoCard, SectionHeader, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, StatCard, Textarea, VehicleSelect,
  fmtDate, fmtINR
} from '../Common/VehicleCommon';
import { TabContentShimmer, ErrorState } from '../Common/StateFeedback';

// ─── Constants ────────────────────────────────────────────────────────────────
const PROVIDER_OPTIONS = [
  { value: 'HDFC', label: 'HDFC Bank' },
  { value: 'ICICI', label: 'ICICI Bank' },
  { value: 'SBI', label: 'SBI' },
  { value: 'AXIS', label: 'Axis Bank' },
  { value: 'PAYTM', label: 'Paytm' },
  { value: 'KOTAK', label: 'Kotak Bank' },
  { value: 'IDFC', label: 'IDFC First' },
  { value: 'OTHER', label: 'Other' },
];

const EMPTY_FORM = {
  vehicle: '', tag_number: '', tag_provider: '',
  recharge_balance: '', issue_date: '',
  expiry_date: '', is_active: true, linked_bank_account: '',
  notes: '',
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
      <InfoCard label="Provider" value={data.tag_provider_display ?? data.tag_provider} />
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
        <Badge className={data.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
          <span className={`w-1.5 h-1.5 rounded-full ${data.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {data.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <InfoCard label="Tag Number" value={data.tag_number || '—'} />
      <InfoCard label="Balance" value={fmtINR(data.recharge_balance, 2)} />
      <div className="col-span-2">
        <InfoCard label="Linked Bank Account" value={data.linked_bank_account || '—'} icon={CreditCard} />
      </div>
      <InfoCard label="Issue Date" value={fmtDate(data.issue_date)} icon={Calendar} />
      <InfoCard label="Expiry Date" value={fmtDate(data.expiry_date)} icon={Calendar} />
    </div>

    {data.notes && (
      <div className="pt-4 border-t border-gray-100">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Notes</p>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">{data.notes}</p>
      </div>
    )}
  </div>
);

const TollTagModal = ({ initial, onClose, isView, vehicleId, onDeleteRequest }) => {
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
      tag_number: initial.tag_number ?? '',
      tag_provider: initial.tag_provider ?? '',
      recharge_balance: initial.recharge_balance ?? '',
      issue_date: initial.issue_date ?? '',
      expiry_date: initial.expiry_date ?? '',
      is_active: initial.is_active ?? true,
      linked_bank_account: initial.linked_bank_account ?? '',
      notes: initial.notes ?? '',
    } : { ...EMPTY_FORM, vehicle: vehicleId ?? '' }
  );

  const create = useCreateVehicleTollTag();
  const update = useUpdateVehicleTollTag();
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
      title={isView ? 'Toll Tag Details' : isEdit ? 'Edit Toll Tag' : 'Add Toll Tag'}
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
            <FormSec title="Vehicle & Tag Info" />
            <div className="grid grid-cols-2 gap-4">
              {!vehicleId && (
                <div className="col-span-2">
                  <Label required={!isEdit}>Vehicle</Label>
                  <VehicleSelect value={form.vehicle} onChange={(id) => setForm(p => ({ ...p, vehicle: id }))} />
                </div>
              )}
              <Field label="Tag Number" required>
                <Input placeholder="e.g. 600101XXXX" value={form.tag_number} onChange={set('tag_number')} />
              </Field>
              <Field label="Tag Provider" required>
                <Sel value={form.tag_provider} onChange={set('tag_provider')}>
                  <option value="">Select provider</option>
                  {PROVIDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Sel>
              </Field>
              <Field label="Initial Balance">
                <Input type="number" placeholder="e.g. 500" value={form.recharge_balance} onChange={set('recharge_balance')} />
              </Field>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox" id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" />
                <label htmlFor="is_active" className="text-sm font-bold text-[#172B4D]">Active Tag</label>
              </div>
            </div>

            <FormSec title="Lifecycle & Other" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Issue Date">
                <Input type="date" value={form.issue_date} onChange={set('issue_date')} />
              </Field>
              <Field label="Expiry Date" error={errors.expiry_date}>
                <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
              </Field>
              <div className="col-span-2">
                <Field label="Linked Bank Account">
                  <Input placeholder="e.g. HDFC-XXXX-1234" value={form.linked_bank_account} onChange={set('linked_bank_account')} />
                </Field>
              </div>
            </div>

            <Field label="Notes">
              <Textarea value={form.notes} onChange={set('notes')} placeholder="Additional notes..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

const VehicleTollTags = ({ vehicleId, isTab }) => {
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useVehicleTollTags({
    ...(search && { search }),
    ...(providerFilter && { tag_provider: providerFilter }),
    ...(vehicleId && { vehicle: vehicleId }),
  });
  const del = useDeleteVehicleTollTag();

  const tags = useMemo(() => {
    const raw = data?.results ?? data ?? [];
    if (!providerFilter) return raw;
    return raw.filter(t => t.tag_provider === providerFilter);
  }, [data, providerFilter]);

  const stats = useMemo(() => {
    const total = tags.length;
    const active = tags.filter(t => t.is_active).length;
    const balance = tags.reduce((acc, t) => acc + (Number(t.recharge_balance) || 0), 0);
    return { total, active, balance };
  }, [tags]);

  if (isLoading) return <TabContentShimmer />;
  if (isError) return <ErrorState message="Failed to load toll tags" error={error?.message} onRetry={() => refetch()} />;

  return (
    <div className={`flex flex-col h-full bg-[#F4F5F7] ${isTab ? '' : 'p-6'}`}>
      {!isTab && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Toll Tags</h1>
            <p className="text-sm text-gray-400 font-medium">Manage FASTags and electronic toll accounts</p>
          </div>

        </div>
      )}

      {!isTab && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Tag} label="Total Tags" value={stats.total} color="blue" />
          <StatCard icon={CheckCircle} label="Active Tags" value={stats.active} color="emerald" />
          <StatCard icon={IndianRupee} label="Fleet Balance" value={fmtINR(stats.balance, 0)} color="indigo" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Search tags..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#0052CC]/10"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Sel className="w-40" value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="">All Providers</option>
              {PROVIDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Sel>
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm shadow-blue-200">
              <Plus size={16} /> Add Tag
            </button>
          </div>
          {isTab && (
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] shadow-sm">
              <Plus size={14} /> Add Tag
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {!tags.length ? (
            <EmptyState icon={Tag} text="No toll tags found" onAdd={() => setModal({ mode: 'add' })} />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
                <tr className="border-b border-gray-100">
                  {!vehicleId && <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>}
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tag Info</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tags.map(t => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                    {!vehicleId && (
                      <td className="px-5 py-4 text-sm font-medium text-gray-600 truncate max-w-[150px]">
                        <button onClick={() => setViewing(t)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all text-left uppercase hover:underline decoration-blue-400/30 underline-offset-4">
                          {t.vehicle_registration_number ?? t.vehicle_registration ?? t.vehicle_display ?? t.vehicle ?? '—'}
                        </button>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#172B4D] font-mono tracking-tight">{t.tag_number || 'Unnamed'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <Building2 size={11} className="text-gray-300" />
                        {t.tag_provider_display ?? t.tag_provider}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-[#0052CC]">{fmtINR(t.recharge_balance, 0)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={t.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setModal({ mode: 'edit', data: t })} className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
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
        <TollTagModal
          initial={modal.data}
          onClose={() => setModal(null)}
          vehicleId={vehicleId}
          onDeleteRequest={() => { setModal(null); setDeleting(modal.data); }}
        />
      )}
      {viewing && (
        <TollTagModal
          initial={viewing}
          onClose={() => setViewing(null)}
          isView
          vehicleId={vehicleId}
        />
      )}
      {deleting && (
        <DeleteConfirm
          label="Toll Tag"
          onClose={() => setDeleting(null)}
          onConfirm={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
          deleting={del.isPending}
        />
      )}
    </div>
  );
};

export default VehicleTollTags;
