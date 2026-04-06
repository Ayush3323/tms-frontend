import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Download, RefreshCw, Eye,
  Building2, Pencil, RotateCcw,
  Info as LucideInfo
} from 'lucide-react';
import {
  useCustomers, useDeleteCustomer, useCustomerStats,
} from '../../queries/customers/customersQuery';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';
import { Badge, DeleteConfirm, EmptyState } from '../Vehicles/Common/VehicleCommon';
import { CustomerFormModal } from './Common/CustomerFormModal';
import CustomerListFilterBar from './Common/CustomerListFilterBar';

// ── Status Styles ────────────────────────────────────────────────────
const STATUS_STYLES = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  INACTIVE: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  SUSPENDED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  BLACKLISTED: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};
const getStatusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.INACTIVE;

// ── Tier badge colors ────────────────────────────────────────────────
const TIER_STYLES = {
  PLATINUM: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  GOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  SILVER: 'bg-gray-50 text-gray-600 border-gray-200',
  STANDARD: 'bg-gray-50 text-gray-500 border-gray-200',
};


// ═══════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
const CustomersDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [ordering, setOrdering] = useState('legal_name');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);   // { type: 'view'|'create'|'edit', id?: string }
  const [deleteTarget, setDelete] = useState(null);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useCustomers({
    page: currentPage,
    ...(statusFilter === 'DELETED' && { deleted_only: 'true' }),
    ...(statusFilter && statusFilter !== 'DELETED' && { status: statusFilter }),
    ...(customerTypeFilter && { customer_type: customerTypeFilter }),
    ...(ordering && { ordering }),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data: statsData } = useCustomerStats();

  const customers = data?.results ?? data ?? [];
  const total = statsData?.total ?? data?.count ?? customers.length;
  const active = statsData?.active ?? customers.filter(c => c.status === 'ACTIVE').length;
  const inactive = statsData?.inactive ?? customers.filter(c => c.status === 'INACTIVE').length;
  const suspended = statsData?.suspended ?? customers.filter(c => c.status === 'SUSPENDED').length;
  const statsLoading = !statsData;

  const resetFilters = () => { setSearchTerm(''); setStatus(''); setCustomerTypeFilter(''); setOrdering('legal_name'); setCurrentPage(1); };

  // ── Modal Handlers ──────────────────────────────────────────────────
  const openCreate = () => setModal({ type: 'create' });
  const openView = (c) => navigate(`/tenant/dashboard/customers/${c.id}`);
  const openEdit = (c) => setModal({ type: 'edit', customer: c });
  const closeModal = () => setModal(null);
  const deleteMutation = useDeleteCustomer();

  const COLUMNS = [
    {
      header: 'Customer Code',
      render: c => (
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <span className="font-mono text-[13px] font-black text-[#172B4D] block">
            {c.customer_code ?? '—'}
          </span>
          <span className="text-[9px] font-mono text-blue-500/60 tracking-tighter uppercase font-bold block">
            {c.customer_type ?? ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Legal Name',
      render: c => (
        <div className="text-left">
          <button onClick={() => openView(c)}
            className="font-bold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left block">
            {c.legal_name ?? '—'}
          </button>
        </div>
      ),
    },
    {
      header: 'Customer Type',
      render: c => (
        <Badge className="bg-blue-50 text-blue-600 border-blue-100">
          {c.customer_type ?? '—'}
        </Badge>
      ),
    },
    {
      header: 'Tier',
      render: c => {
        const t = c.customer_tier ?? 'STANDARD';
        return (
          <Badge className={TIER_STYLES[t] || TIER_STYLES.STANDARD}>
            {t}
          </Badge>
        );
      },
    },
    {
      header: 'Credit Limit',
      render: c => (
        <span className="font-bold text-gray-700 text-[13px]">
          {c.credit_limit ? `₹${Number(c.credit_limit).toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: c => {
        const isDeletedView = statusFilter === 'DELETED';
        const statusLabel = (c.is_deleted || isDeletedView) ? 'DELETED' : c.status;
        const st = (c.is_deleted || isDeletedView)
          ? { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
          : getStatusStyle(c.status);
        return (
          <Badge className={`${st.bg} ${st.text} border-transparent`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: c => (
        <div className="flex items-center gap-2">
          <button onClick={() => openView(c)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[#0052CC] bg-[#EBF3FF] border border-[#0052CC]/10 rounded-lg hover:bg-[#0052CC] hover:text-white transition-all shadow-sm group/view">
            <Eye size={12} className="group-hover/view:scale-110 transition-transform" />
            <span>View</span>
          </button>
        </div>
      ),
    },
  ];


  // ═══════════════════════════════════════════════════════════════════
  // ── RENDER ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* Page Title & Search Section */}
      <div className="flex items-center">
        {/* Title Block */}
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Customers</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage customer profiles and operations</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search customer name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50  transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              title="Refresh Data"
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh</span>
            </button>
            <button
              title="Export Customers"
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {statsLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
                <span className="text-[18px] font-black text-orange-500">{inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Suspended:</span>
                <span className="text-[18px] font-black text-red-500">{suspended}</span>
              </div>
            </>
          )}
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={openCreate}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Customer
            </button>
          </div>
        </div>
        <CustomerListFilterBar
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatus(value);
            setCurrentPage(1);
          }}
          statusOptions={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'BLACKLISTED', label: 'Blacklisted' },
            { value: 'DELETED', label: 'Deleted' },
          ]}
          ordering={ordering}
          onOrderingChange={(value) => {
            setOrdering(value);
            setCurrentPage(1);
          }}
          orderingOptions={[
            { value: 'legal_name', label: 'Name A-Z' },
            { value: '-legal_name', label: 'Name Z-A' },
            { value: '-created_at', label: 'Newest' },
            { value: 'created_at', label: 'Oldest' },
          ]}
          extraFilters={(
            <select
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
            >
              <option value="">All Types</option>
              <option value="CONSIGNOR">Consignor</option>
              <option value="CONSIGNEE">Consignee</option>
              <option value="BOTH">Both</option>
              <option value="BROKER">Broker</option>
              <option value="AGENT">Agent</option>
              <option value="OTHER">Other</option>
            </select>
          )}
          clearVisible={statusFilter || customerTypeFilter || ordering !== 'legal_name'}
          onClearFilters={resetFilters}
          currentPage={currentPage}
          onPrevPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => prev + 1)}
          hasNextPage={!!data?.next}
          isLoading={isLoading}
        />

        {/* Loading State */}
        {isLoading && <TableShimmer rows={8} cols={6} />}

        {/* Error State */}
        {isError && (
          <ErrorState message="Failed to load customers" error={error?.response?.data?.detail || error?.message} onRetry={() => refetch()} />
        )}

        {/* Data Table */}
        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="px-4 py-4">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c.id || c.customer_code} className="hover:bg-blue-50/30 transition-colors">
                    {COLUMNS.map(col => (
                      <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(c)}</td>
                    ))}
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-8">
                      <EmptyState icon={Building2} text="No customers found" onAdd={openCreate} addLabel="Add Your First Customer" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination Section */}
        {!isLoading && !isError && (
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D]">{customers.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> customers
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <CustomerFormModal
          initial={modal.customer}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          label="Customer"
          onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};


export default CustomersDashboard;
