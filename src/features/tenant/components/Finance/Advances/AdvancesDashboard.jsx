import React, { useMemo, useState } from 'react'
import { CheckCircle2, Coins, Plus, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useAdvanceCategories,
  useAdvances,
  useApproveAdvance,
  useCreateAdvanceRequest,
  useDeleteAdvanceCategory,
  useDisburseAdvance,
  useRejectAdvance,
  useSettleAdvance,
  useTripsLookup,
  useUpdateAdvanceCategory,
} from '../../../queries/finance/financeQuery'
import { useDrivers } from '../../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../../Drivers/common/utils'
import AdvanceCategoryModal from './AdvanceCategoryModal'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function AdvancesDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showSettle, setShowSettle] = useState(null)
  const [showCats, setShowCats] = useState(false)
  const { data: driversData } = useDrivers({ page_size: 1000 })
  const { data: tripsData } = useTripsLookup({ page_size: 200 })
  const trips = asList(tripsData)
  const drivers = asList(driversData)
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
  const updateCat = useUpdateAdvanceCategory()
  const deleteCat = useDeleteAdvanceCategory()
  
  const tripOptions = useMemo(() => trips.map((t) => {
    const tripNo = t.trip_number || String(t.id).slice(-8).toUpperCase()
    const route = [t.origin_address, t.destination_address].filter(Boolean).join(' -> ')
    return {
      id: t.id,
      label: route ? `${tripNo} (${route})` : tripNo,
    }
  }), [trips])

  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Approved', value: rows.filter((r) => r.status === 'APPROVED').length, className: 'text-indigo-600' },
    { label: 'Disbursed', value: rows.filter((r) => r.status === 'DISBURSED').length, className: 'text-green-600' },
    { label: 'Settled', value: rows.filter((r) => r.status === 'SETTLED').length, className: 'text-teal-600' },
    { label: 'Rejected', value: rows.filter((r) => r.status === 'REJECTED').length, className: 'text-red-600' },
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
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'id', title: 'Request #', render: (_, r) => String(r.id).slice(-8).toUpperCase() },
          { 
            key: 'user_id', 
            title: 'Employee',
            render: (uid) => {
              const d = drivers.find(drv => drv.user_id === uid)
              return d ? getDriverName(d) : String(uid).slice(-8).toUpperCase()
            }
          },
          { 
            key: 'category', 
            title: 'Category',
            render: (cid) => {
              const c = categories.find(cat => cat.id === cid)
              return c ? (c.category_name || c.category_code) : String(cid).slice(-8).toUpperCase()
            }
          },
          { key: 'amount', title: 'Amount', render: (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'request_date', title: 'Date' },
          { 
            key: 'trip_id', 
            title: 'Trip',
            render: (tid) => {
              if (!tid) return '-'
              const t = trips.find(tr => tr.id === tid)
              return t ? (t.trip_number || String(t.id).slice(-8).toUpperCase()) : String(tid).slice(-8).toUpperCase()
            }
          },
          { key: 'status', title: 'Status' },
        ]}
        actions={(
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowCats(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors">
              Categories
            </button>
            <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-bold shadow-sm hover:bg-[#0047b3] transition-colors">
              <Plus size={14} /> New request
            </button>
          </div>
        )}
        rowActions={(row) => (
          <>
            <button type="button" onClick={() => navigate(`/tenant/dashboard/finance/advances/${row.id}`)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all">
              View
            </button>
            {row.status === 'PENDING' && (
              <>
                <button type="button" disabled={approve.isPending} onClick={() => approve.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50 transition-colors"><CheckCircle2 size={16} /></button>
                <button
                  type="button"
                  disabled={reject.isPending}
                  onClick={() => {
                    const rejection_reason = window.prompt('Rejection reason?') || 'Rejected'
                    reject.mutate({ id: row.id, rejection_reason })
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50 transition-colors"
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
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50 transition-colors"
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-2 shadow-xl text-xs anim-scale-in">
            <h3 className="text-base font-bold text-[#172B4D]">New advance request</h3>
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none"
              value={createForm.user_id}
              onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })}
            >
              <option value="">Select Employee/Driver</option>
              {drivers.map(d => (
                <option key={d.id} value={d.user_id}>
                  {getDriverName(d)} ({d.employee_id || d.id.slice(-6)})
                </option>
              ))}
            </select>
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name || c.category_code}</option>
              ))}
            </select>
            <input className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none" type="number" placeholder="Amount" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} />
            <input className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Reason" value={createForm.reason} onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })} />
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none"
              value={createForm.trip_id}
              onChange={(e) => setCreateForm({ ...createForm, trip_id: e.target.value })}
            >
              <option value="">Link to Trip (Optional)</option>
              {tripOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <input type="date" className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none" value={createForm.request_date} onChange={(e) => setCreateForm({ ...createForm, request_date: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-1.5 text-gray-500 font-semibold hover:text-gray-700 transition-colors" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-lg bg-[#0052CC] text-white font-bold hover:bg-[#0047b3] transition-colors shadow-sm disabled:opacity-50"
                disabled={createReq.isPending || !createForm.user_id || !createForm.category || !createForm.amount || !createForm.reason}
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-3 shadow-xl text-xs anim-scale-in">
            <h3 className="text-base font-bold text-[#172B4D]">Settle advance</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Amount to settle</label>
              <input className="w-full border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Amount settled" value={settlePayload.amount_settled} onChange={(e) => setSettlePayload({ ...settlePayload, amount_settled: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Settlement Against</label>
              <select
                className="w-full border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100"
                value={settlePayload.settlement_against}
                onChange={(e) => setSettlePayload({ ...settlePayload, settlement_against: e.target.value })}
              >
                <option value="SALARY">SALARY</option>
                <option value="TRIP_EARNING">TRIP_EARNING</option>
                <option value="COMMISSION">COMMISSION</option>
                <option value="BONUS">BONUS</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Notes</label>
              <input className="w-full border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100" placeholder="Notes" value={settlePayload.notes} onChange={(e) => setSettlePayload({ ...settlePayload, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-1.5 text-gray-500 font-semibold" onClick={() => setShowSettle(null)}>Cancel</button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-lg bg-[#0052CC] text-white font-bold hover:bg-[#0047b3] transition-colors shadow-sm"
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
      <AdvanceCategoryModal isOpen={showCats} onClose={() => setShowCats(false)} />
    </>
  )
}
