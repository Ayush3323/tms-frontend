import React, { useState } from 'react';
import {
  Plus, RefreshCw, Loader2, AlertCircle, X,
  ChevronDown, Truck, Package, Weight, ToggleLeft,
  ToggleRight, Pencil, Trash2, Search, Box
} from 'lucide-react';
import {
  useVehicleTypes,
  useCreateVehicleType,
  useUpdateVehicleType,
  useDeleteVehicleType,
} from '../../queries/vehicles/vehicletypeQuery';

// ── Constants ─────────────────────────────────────────────────────────
const CATEGORIES = ['Truck', 'LCV', 'HCV', 'Pickup', 'Tanker', 'Bus', 'Other'];

const CATEGORY_COLORS = {
  Truck:  'bg-blue-50 text-blue-600 border-blue-200',
  LCV:    'bg-green-50 text-green-600 border-green-200',
  HCV:    'bg-purple-50 text-purple-600 border-purple-200',
  Pickup: 'bg-orange-50 text-orange-600 border-orange-200',
  Tanker: 'bg-teal-50 text-teal-600 border-teal-200',
  Bus:    'bg-pink-50 text-pink-600 border-pink-200',
  Other:  'bg-gray-50 text-gray-500 border-gray-200',
};

const EMPTY_FORM = {
  type_code: '',
  type_name: '',
  category: '',
  
  typical_capacity_tonnage: '',
  typical_capacity_volume: '',
  is_active: true,
};

// ── Field components ──────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-bold text-gray-600 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props) => (
  <input {...props}
    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
      placeholder:text-gray-300 transition-all" />
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

// ── Add / Edit Modal ──────────────────────────────────────────────────
const TypeModal = ({ initial, onClose }) => {
  const [form, setForm] = useState(
    initial
      ? {
          type_code: initial.type_code ?? '',
          type_name: initial.type_name ?? '',
          category:  initial.category  ?? '',
          
          typical_capacity_tonnage: initial.typical_capacity_tonnage ?? '',
          typical_capacity_volume:  initial.typical_capacity_volume  ?? '',
          is_active: initial.is_active ?? true,
        }
      : EMPTY_FORM
  );

  const isEdit       = !!initial?.id;
  const createType   = useCreateVehicleType();
  const updateType   = useUpdateVehicleType();
  const isPending    = createType.isPending || updateType.isPending;

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    if (isEdit) {
      updateType.mutate({ id: initial.id, data: form }, { onSuccess: onClose });
    } else {
      createType.mutate(form, { onSuccess: onClose });
    }
  };

  const canSubmit = form.type_code && form.type_name && form.category && !isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-[#172B4D]">
              {isEdit ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Update the type details' : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Type Code</Label>
              <Input placeholder="e.g. TRUCK_20T" value={form.type_code} onChange={set('type_code')} />
            </div>
            <div>
              <Label required>Type Name</Label>
              <Input placeholder="e.g. 20 Ton Truck" value={form.type_name} onChange={set('type_name')} />
            </div>
          </div>

          <div>
            <Label required>Category</Label>
            <Sel value={form.category} onChange={set('category')}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Sel>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="Brief description of this vehicle type..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
                placeholder:text-gray-300 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Typical Capacity (Tonnage)</Label>
              <Input type="number" step="0.01" placeholder="e.g. 20.00"
                value={form.typical_capacity_tonnage} onChange={set('typical_capacity_tonnage')} />
            </div>
            <div>
              <Label>Typical Capacity (Volume m³)</Label>
              <Input type="number" step="0.01" placeholder="e.g. 40.00"
                value={form.typical_capacity_volume} onChange={set('typical_capacity_volume')} />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-700">Active Status</p>
              <p className="text-xs text-gray-400">Inactive types won't appear in vehicle creation</p>
            </div>
            <button
              onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                form.is_active
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}
            >
              {form.is_active
                ? <><ToggleRight size={16} /> Active</>
                : <><ToggleLeft size={16} /> Inactive</>
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Plus size={14} /> {isEdit ? 'Update Type' : 'Add Type'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────
const DeleteModal = ({ type, onClose }) => {
  const deleteType = useDeleteVehicleType();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-[#172B4D]">Delete Vehicle Type?</h2>
          <p className="text-sm text-gray-400 mt-1">
            <span className="font-semibold text-gray-700">{type.type_name}</span> ({type.type_code}) will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            onClick={() => deleteType.mutate(type.id, { onSuccess: onClose })}
            disabled={deleteType.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50">
            {deleteType.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Deleting...</>
              : <><Trash2 size={14} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.iconBg}`}>
        <Icon size={15} className={color.iconText} />
      </span>
    </div>
    {loading
      ? <div className="h-9 w-12 bg-gray-100 rounded animate-pulse" />
      : <span className={`text-3xl font-black ${color.value}`}>{value}</span>
    }
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────
const VehicleTypes = () => {
  const [search, setSearch]         = useState('');
  const [catFilter, setCat]         = useState('');
  const [activeFilter, setActive]   = useState('');
  const [modal, setModal]           = useState(null);   // null | 'add' | typeObj
  const [deleteTarget, setDelete]   = useState(null);   // null | typeObj

  // ── API ──
  const { data, isLoading, isError, error, refetch } = useVehicleTypes({
    ...(catFilter    && { category: catFilter }),
    ...(activeFilter !== '' && { is_active: activeFilter }),
    ...(search       && { search }),
  });

  const types   = data?.results ?? data ?? [];
  const total   = data?.count   ?? types.length;
  const active  = types.filter(t => t.is_active).length;
  const inactive= types.filter(t => !t.is_active).length;
  const cats    = [...new Set(types.map(t => t.category))].length;

  const resetFilters = () => { setSearch(''); setCat(''); setActive(''); };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen">

      {/* Modals */}
      {(modal === 'add' || (modal && modal !== 'add')) && (
        <TypeModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal type={deleteTarget} onClose={() => setDelete(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172B4D]">Vehicle Types</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage vehicle categories and capacity configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
            <Plus size={15} /> Add Type
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard loading={isLoading} label="Total Types"  value={total}    icon={Truck}       color={{ value: 'text-[#172B4D]', iconBg: 'bg-blue-50',   iconText: 'text-blue-500' }} />
        <StatCard loading={isLoading} label="Active"       value={active}   icon={ToggleRight} color={{ value: 'text-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-500' }} />
        <StatCard loading={isLoading} label="Inactive"     value={inactive} icon={ToggleLeft}  color={{ value: 'text-gray-500',   iconBg: 'bg-gray-100',  iconText: 'text-gray-400' }} />
        <StatCard loading={isLoading} label="Categories"   value={cats}     icon={Package}     color={{ value: 'text-purple-600', iconBg: 'bg-purple-50', iconText: 'text-purple-500' }} />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Table header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172B4D]">📋 Type Registry</h2>
            <p className="text-xs text-gray-400 mt-0.5">All configured vehicle type definitions</p>
          </div>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all">
            <Plus size={14} /> Add Type
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search type code or name..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] bg-gray-50" />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select value={catFilter} onChange={e => setCat(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Active filter */}
          <div className="relative">
            <select value={activeFilter} onChange={e => setActive(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-[#0052CC]" />
            <span className="text-sm">Loading vehicle types...</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">Failed to load vehicle types</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Type Code', 'Type Name', 'Category', 'Tonnage', 'Volume (m³)', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {types.map(t => {
                  const catColor = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.Other;
                  return (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">

                      {/* Type Code */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-[#172B4D] font-mono text-[13px]">{t.type_code}</span>
                      </td>

                      {/* Type Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">{t.type_name}</span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${catColor}`}>
                          {t.category}
                        </span>
                      </td>

                      
                      {/* Tonnage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.typical_capacity_tonnage
                          ? <span className="flex items-center gap-1 text-gray-700 font-semibold text-[13px]">
                              <Weight size={13} className="text-gray-400" />
                              {t.typical_capacity_tonnage}T
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.typical_capacity_volume
                          ? <span className="flex items-center gap-1 text-gray-700 font-semibold text-[13px]">
                              <Box size={13} className="text-gray-400" />
                              {t.typical_capacity_volume}
                            </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit
                          ${t.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModal(t)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDelete(t)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {types.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No vehicle types found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing <span className="font-bold text-gray-600">{types.length}</span>
              {data?.count && data.count !== types.length &&
                <> of <span className="font-bold text-gray-600">{data.count}</span></>
              } types
            </span>
            <span className="text-[11px]">Fleet Management System</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleTypes;
