import React, { useMemo, useState } from 'react'
import { CheckCircle2, Edit2, Plus, Receipt, Trash2 } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useTDSEntries,
  useCreateTDSEntry,
  useUpdateTDSEntry,
  useDeleteTDSEntry,
  useIssueTDSCertificate,
  useMarkTDSEntryPaid,
} from '../../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function TDSEntriesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showIssue, setShowIssue] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const initialForm = {
    financial_year: new Date().getFullYear().toString(),
    tds_rate: '0.00',
    tds_amount: '0.00',
    status: 'DEDUCTED',
    notes: '',
  }
  const [form, setForm] = useState(initialForm)
  const [issueForm, setIssueForm] = useState({ tds_certificate_number: '' })

  const queryParams = useMemo(() => {
    const p = { page_size: 100 }
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])

  const { data, isLoading, refetch } = useTDSEntries(queryParams)
  const createEntry = useCreateTDSEntry()
  const updateEntry = useUpdateTDSEntry()
  const deleteEntry = useDeleteTDSEntry()
  const issueCert = useIssueTDSCertificate()
  const markPaid = useMarkTDSEntryPaid()

  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total Entries', value: rows.length, className: 'text-blue-600' },
    { label: 'Deducted', value: rows.filter(r => r.status === 'DEDUCTED').length, className: 'text-amber-600' },
    { label: 'Paid', value: rows.filter(r => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [rows])

  const handleSave = () => {
    if (editingId) {
      updateEntry.mutate({ id: editingId, data: form }, { onSuccess: () => { setShowForm(false); refetch() } })
    } else {
      createEntry.mutate(form, { onSuccess: () => { setShowForm(false); refetch() } })
    }
  }

  const handleIssue = () => {
    issueCert.mutate({ id: selectedId, ...issueForm }, { onSuccess: () => { setShowIssue(false); setIssueForm({ tds_certificate_number: '' }); refetch() } })
  }

  return (
    <>
      <FinanceListPage
        embedded
        title="TDS Entries"
        subtitle="Manage individual TDS deductions and issue certificates."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="DEDUCTED">Deducted</option>
            <option value="PAID">Paid</option>
            <option value="CERTIFIED">Certified</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'financial_year', title: 'FY', render: (v) => <span className="font-bold text-[#172B4D]">{v}</span> },
          { key: 'tds_rate', title: 'Rate %', render: (v) => <span className="font-medium">{v}%</span> },
          { key: 'tds_amount', title: 'Amount', render: (v) => <span className="font-black text-red-600">₹{parseFloat(v).toLocaleString()}</span> },
          { key: 'tds_certificate_number', title: 'Cert #', render: (v) => v || <span className="text-gray-300 italic">Not issued</span> },
          { 
            key: 'status', 
            title: 'Status',
            render: (s) => (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                s === 'PAID' ? 'bg-green-100 text-green-700' :
                s === 'CERTIFIED' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
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
            <Plus size={14} /> New Entry
          </button>
        )}
        rowActions={(row) => (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setForm(row); setEditingId(row.id); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"><Edit2 size={16} /></button>
            <button type="button" onClick={() => window.confirm('Delete entry?') && deleteEntry.mutate(row.id, { onSuccess: refetch })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 size={16} /></button>
            {row.status === 'DEDUCTED' && (
              <button type="button" disabled={markPaid.isPending} onClick={() => markPaid.mutate(row.id, { onSuccess: refetch })} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all" title="Mark Paid"><CheckCircle2 size={16} /></button>
            )}
            {!row.tds_certificate_number && (
              <button type="button" onClick={() => { setSelectedId(row.id); setShowIssue(true) }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all" title="Issue Certificate"><Receipt size={16} /></button>
            )}
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-[#172B4D] tracking-tight">{editingId ? 'Edit TDS Entry' : 'Manual TDS Entry'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Year</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="2023-24" value={form.financial_year} onChange={(e) => setForm({ ...form, financial_year: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TDS Rate (%)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.tds_rate} onChange={(e) => setForm({ ...form, tds_rate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px) font-bold text-gray-400 uppercase tracking-widest leading-loose">TDS Amount (₹)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.tds_amount} onChange={(e) => setForm({ ...form, tds_amount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Status</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="DEDUCTED">Deducted</option>
                  <option value="PAID">Paid</option>
                  <option value="CERTIFIED">Certified</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Notes</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[80px]" placeholder="Additional remarks..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest" onClick={() => setShowForm(false)}>Discard</button>
              <button type="button" className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest" disabled={createEntry.isPending || updateEntry.isPending} onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-[#172B4D] tracking-tight">Issue Certificate</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Certificate Number</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Enter valid TRACES number..." value={issueForm.tds_certificate_number} onChange={(e) => setIssueForm({ tds_certificate_number: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest" onClick={() => setShowIssue(false)}>Cancel</button>
              <button type="button" className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50" disabled={!issueForm.tds_certificate_number || issueCert.isPending} onClick={handleIssue}>Confirm Issue</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
