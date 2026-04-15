import React, { useMemo, useState } from 'react'
import { CheckCircle2, CloudUpload, Edit2, Plus, Trash2 } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useTDSReturns,
  useCreateTDSReturn,
  useUpdateTDSReturn,
  useDeleteTDSReturn,
  useFileTDSReturn,
  useMarkTDSReturnPaid,
} from '../../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function TDSReturnsPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const initialForm = {
    financial_year: '2023-24',
    quarter: 'Q1',
    total_tds_deducted: '0.00',
    total_tds_paid: '0.00',
    status: 'DRAFT',
  }
  const [form, setForm] = useState(initialForm)

  const { data, isLoading, refetch } = useTDSReturns({ page_size: 100, search })
  const createReturn = useCreateTDSReturn()
  const updateReturn = useUpdateTDSReturn()
  const deleteReturn = useDeleteTDSReturn()
  const fileReturn = useFileTDSReturn()
  const markPaid = useMarkTDSReturnPaid()

  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total Returns', value: rows.length, className: 'text-blue-600' },
    { label: 'Filed', value: rows.filter(r => r.status === 'FILED').length, className: 'text-indigo-600' },
    { label: 'Pending Payment', value: rows.filter(r => r.status === 'PENDING_PAYMENT').length, className: 'text-amber-600' },
  ]), [rows])

  const handleSave = () => {
    if (editingId) {
      updateReturn.mutate({ id: editingId, data: form }, { onSuccess: () => { setShowForm(false); refetch() } })
    } else {
      createReturn.mutate(form, { onSuccess: () => { setShowForm(false); refetch() } })
    }
  }

  return (
    <>
      <FinanceListPage
        embedded
        title="Quarterly Returns"
        subtitle="Manage and file TDS quarterly returns."
        search={search}
        setSearch={setSearch}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'financial_year', title: 'FY', render: (v) => <span className="font-bold text-[#172B4D]">{v}</span> },
          { key: 'quarter', title: 'Quarter' },
          { key: 'total_tds_deducted', title: 'Deducted', render: (v) => <span className="font-medium text-gray-700">₹{parseFloat(v).toLocaleString()}</span> },
          { key: 'total_tds_paid', title: 'Paid', render: (v) => <span className="font-bold text-emerald-600">₹{parseFloat(v).toLocaleString()}</span> },
          { 
            key: 'status', 
            title: 'Status',
            render: (s) => (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                s === 'FILED' ? 'bg-green-100 text-green-700' :
                s === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {s}
              </span>
            )
          },
        ]}
        actions={(
          <button 
            type="button" 
            onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true) }} 
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0747A6] text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> New Return
          </button>
        )}
        rowActions={(row) => (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setForm(row); setEditingId(row.id); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"><Edit2 size={16} /></button>
            <button type="button" onClick={() => window.confirm('Delete return?') && deleteReturn.mutate(row.id, { onSuccess: refetch })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 size={16} /></button>
            {row.status === 'DRAFT' && (
              <button 
                type="button" 
                disabled={fileReturn.isPending} 
                onClick={() => window.confirm('File this return?') && fileReturn.mutate({ id: row.id }, { onSuccess: refetch })} 
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all" 
                title="File Return"
              >
                <CloudUpload size={16} />
              </button>
            )}
            {row.status === 'FILED' && (
              <button 
                type="button" 
                disabled={markPaid.isPending} 
                onClick={() => markPaid.mutate(row.id, { onSuccess: refetch })} 
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all" 
                title="Mark Paid"
              >
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-[#172B4D] tracking-tight">{editingId ? 'Edit Return' : 'Create Quarterly Return'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Year</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="2023-24" value={form.financial_year} onChange={(e) => setForm({ ...form, financial_year: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quarter</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })}>
                  <option value="Q1">Q1 (Apr-Jun)</option>
                  <option value="Q2">Q2 (Jul-Sep)</option>
                  <option value="Q3">Q3 (Oct-Dec)</option>
                  <option value="Q4">Q4 (Jan-Mar)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Deducted (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.total_tds_deducted} onChange={(e) => setForm({ ...form, total_tds_deducted: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Paid (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.total_tds_paid} onChange={(e) => setForm({ ...form, total_tds_paid: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest" onClick={() => setShowForm(false)}>Discard</button>
              <button type="button" className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest" disabled={createReturn.isPending || updateReturn.isPending} onClick={handleSave}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
