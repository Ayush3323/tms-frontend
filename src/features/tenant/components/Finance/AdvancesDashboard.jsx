import React, { useMemo, useState } from 'react'
import { CheckCircle2, Coins, Plus, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from './FinanceListPage'
import {
  useAdvanceCategories,
  useAdvances,
  useApproveAdvance,
  useCreateAdvanceRequest,
  useDisburseAdvance,
  useRejectAdvance,
  useSettleAdvance,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function AdvancesDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showSettle, setShowSettle] = useState(null)
  const [settlePayload, setSettlePayload] = useState({ settlement_against: 'SALARY', amount_settled: '', notes: '' })
  const [createForm, setCreateForm] = useState({
    user_id: '',
    category: '',
    amount: '',
    reason: '',
    trip_id: '',
    request_date: new Date().toISOString().slice(0, 10),
  })
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useAdvances(queryParams)
  const { data: catData } = useAdvanceCategories()
  const categories = asList(catData)
  const approve = useApproveAdvance()
  const reject = useRejectAdvance()
  const disburse = useDisburseAdvance()
  const settle = useSettleAdvance()
  const createReq = useCreateAdvanceRequest()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Approved', value: rows.filter((r) => r.status === 'APPROVED').length, className: 'text-indigo-600' },
    { label: 'Disbursed', value: rows.filter((r) => r.status === 'DISBURSED').length, className: 'text-green-600' },
    { label: 'Settled', value: rows.filter((r) => r.status === 'SETTLED').length, className: 'text-teal-600' },
  ]), [data?.count, rows])

  return (
    <>
      <FinanceListPage
        title="Advances"
        subtitle="Manage request approvals, disbursements, and settlements."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DISBURSED">Disbursed</option>
            <option value="SETTLED">Settled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'id', title: 'Request #', render: (_, r) => String(r.id).slice(-8).toUpperCase() },
          { key: 'user_id', title: 'Employee' },
          { key: 'category', title: 'Category' },
          { key: 'amount', title: 'Amount' },
          { key: 'request_date', title: 'Date' },
          { key: 'trip_id', title: 'Trip' },
          { key: 'status', title: 'Status' },
        ]}
        actions={(
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold">
            <Plus size={14} /> New request
          </button>
        )}
        rowActions={(row) => (
          <>
            <button type="button" onClick={() => navigate(`/tenant/dashboard/finance/advances/${row.id}`)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all">
              View
            </button>
            {row.status === 'PENDING' && (
              <>
                <button type="button" disabled={approve.isPending} onClick={() => approve.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50"><CheckCircle2 size={16} /></button>
                <button
                  type="button"
                  disabled={reject.isPending}
                  onClick={() => {
                    const rejection_reason = window.prompt('Rejection reason?') || 'Rejected'
                    reject.mutate({ id: row.id, rejection_reason })
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50"
                >
                  <XCircle size={16} />
                </button>
              </>
            )}
            {row.status === 'APPROVED' && (
              <button type="button" disabled={disburse.isPending} onClick={() => disburse.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all disabled:opacity-50">
                Disburse
              </button>
            )}
            {row.status === 'DISBURSED' && (
              <button
                type="button"
                disabled={settle.isPending}
                onClick={() => {
                  setShowSettle(row.id)
                  setSettlePayload({ settlement_against: 'SALARY', amount_settled: '', notes: '' })
                }}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
                title="Settle"
              >
                <Coins size={16} />
              </button>
            )}
          </>
        )}
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-2 shadow-xl text-xs">
            <h3 className="text-base font-bold">New advance request</h3>
            <input className="w-full border rounded px-2 py-1" placeholder="User UUID" value={createForm.user_id} onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })} />
            <select
              className="w-full border rounded px-2 py-1"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name || c.category_code}</option>
              ))}
            </select>
            <input className="w-full border rounded px-2 py-1" type="number" placeholder="Amount" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Reason" value={createForm.reason} onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Trip UUID (optional)" value={createForm.trip_id} onChange={(e) => setCreateForm({ ...createForm, trip_id: e.target.value })} />
            <input type="date" className="w-full border rounded px-2 py-1" value={createForm.request_date} onChange={(e) => setCreateForm({ ...createForm, request_date: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-[#0052CC] text-white font-bold"
                disabled={createReq.isPending || !createForm.user_id || !createForm.category || !createForm.amount}
                onClick={() => {
                  const payload = {
                    user_id: createForm.user_id,
                    category: createForm.category,
                    amount: createForm.amount,
                    reason: createForm.reason,
                    request_date: createForm.request_date,
                  }
                  if (createForm.trip_id) payload.trip_id = createForm.trip_id
                  createReq.mutate(payload, { onSuccess: () => { setShowCreate(false); refetch() } })
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-2 shadow-xl text-xs">
            <h3 className="font-bold">Settle advance</h3>
            <input className="w-full border rounded px-2 py-1" placeholder="Amount settled" value={settlePayload.amount_settled} onChange={(e) => setSettlePayload({ ...settlePayload, amount_settled: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Against (e.g. SALARY)" value={settlePayload.settlement_against} onChange={(e) => setSettlePayload({ ...settlePayload, settlement_against: e.target.value })} />
            <input className="w-full border rounded px-2 py-1" placeholder="Notes" value={settlePayload.notes} onChange={(e) => setSettlePayload({ ...settlePayload, notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSettle(null)}>Cancel</button>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-[#0052CC] text-white font-bold"
                onClick={() => settle.mutate({
                  id: showSettle,
                  data: {
                    amount_settled: settlePayload.amount_settled || undefined,
                    settlement_against: settlePayload.settlement_against,
                    notes: settlePayload.notes,
                  },
                }, { onSuccess: () => { setShowSettle(null); refetch() } })}
              >
                Settle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
