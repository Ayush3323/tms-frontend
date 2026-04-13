import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { ArrowLeft, Settings2 } from 'lucide-react'

import { advanceApi } from '../../api/finance/financeEndpoint'
import {
  useAdvanceApprovals,
  useAdvanceCategories,
  useAdvanceDetail,
  useAdvanceDisbursements,
  useTripsLookup,
} from '../../queries/finance/financeQuery'
import { useDrivers } from '../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../Drivers/common/utils'
import AdvanceCategoryModal from './AdvanceCategoryModal'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function AdvanceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState('details')
  const [showCats, setShowCats] = useState(false)
  const { data, isLoading } = useAdvanceDetail(id)
  const { data: disbData } = useAdvanceDisbursements(id ? { request: id } : {})
  const { data: apprData } = useAdvanceApprovals(id ? { request: id } : {})
  
  const { data: driversData } = useDrivers({ page_size: 1000 })
  const { data: catData } = useAdvanceCategories()
  const { data: tripsData } = useTripsLookup({ page_size: 1000 })

  const drivers = asList(driversData)
  const categories = asList(catData)
  const trips = asList(tripsData)

  const disbursements = asList(disbData)
  const approvals = asList(apprData)

  const repaymentQueries = useQueries({
    queries: disbursements.map((d) => ({
      queryKey: ['finance', 'advanceRepayments', d.id],
      queryFn: () => advanceApi.listRepayments({ disbursement: d.id }),
      enabled: !!d.id && tab === 'repayments',
    })),
  })
  const repayments = useMemo(() => {
    const all = []
    for (const q of repaymentQueries) {
      all.push(...asList(q.data))
    }
    return all
  }, [repaymentQueries])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-[#0052CC] text-sm font-semibold hover:underline">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-gray-500 italic">Loading advance details...</p>
          ) : !data ? (
            <p className="text-sm text-gray-500 italic">Advance record not found.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#172B4D]">Advance {String(data.id).slice(-8).toUpperCase()}</h1>
                  <p className="text-xs text-gray-500 mt-1">Manage lifecycle and review history of this advance request.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCats(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Settings2 size={14} /> Categories
                </button>
              </div>

              <div className="flex gap-2 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
                {['details', 'disbursement', 'repayments', 'approvals'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                      tab === t ? 'bg-[#0052CC] text-white shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {t === 'details' ? 'Overview' : t}
                  </button>
                ))}
              </div>

              {tab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                  <DetailItem 
                    label="User/Employee" 
                    value={(() => {
                      const d = drivers.find(drv => drv.user_id === data.user_id)
                      return d ? getDriverName(d) : data.user_id
                    })()} 
                  />
                  <DetailItem 
                    label="Category" 
                    value={(() => {
                      const c = categories.find(cat => cat.id === data.category)
                      return c ? (c.category_name || c.category_code) : data.category
                    })()} 
                  />
                  <DetailItem label="Request Date" value={data.request_date} />
                  <DetailItem label="Amount" value={Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} highlight />
                  <DetailItem label="Status" value={data.status_display || data.status} status />
                  <DetailItem 
                    label="Trip" 
                    value={(() => {
                      if (!data.trip_id) return 'Not linked to trip'
                      const t = trips.find(tr => tr.id === data.trip_id)
                      return t ? (t.trip_number || t.id.slice(-8).toUpperCase()) : data.trip_id
                    })()} 
                  />
                  {data.reason && <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 underline uppercase mb-1">Reason / Notes</p>
                    <p className="text-sm text-[#172B4D] leading-relaxed">{data.reason}</p>
                  </div>}
                  {data.rejection_reason && (
                    <div className="md:col-span-2 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                      <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-700 font-medium">{data.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'disbursement' && (
                <div className="space-y-3">
                  {disbursements.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-400 italic">No disbursement records found for this request.</p>
                    </div>
                  ) : disbursements.map((d) => (
                    <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-[#172B4D]">Amount: {Number(d.amount_disbursed).toLocaleString()}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.payment_mode === 'CASH' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                          {d.payment_mode}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p className="text-gray-500">Date: <span className="font-semibold text-gray-700">{d.disbursement_date}</span></p>
                        <p className="text-gray-500">Ref: <span className="font-semibold text-gray-700">{d.payment_reference || '-'}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'repayments' && (
                <div className="space-y-3">
                  {repaymentQueries.some((q) => q.isLoading) ? (
                    <p className="text-sm text-gray-500 italic">Loading repayment history...</p>
                  ) : repayments.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-400 italic">No repayments have been recorded yet.</p>
                    </div>
                  ) : repayments.map((r) => (
                    <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Repayment Date</p>
                        <p className="text-sm font-semibold text-[#172B4D]">{r.repayment_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Amount</p>
                        <p className="text-sm font-bold text-green-600">{Number(r.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'approvals' && (
                <div className="space-y-3">
                  {approvals.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-400 italic">No approval history found.</p>
                    </div>
                  ) : approvals.map((a) => (
                    <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-[#172B4D]">Level {a.approval_level} - {a.action}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{a.approval_date}</p>
                      </div>
                      <p className="text-xs text-gray-600 italic">"{a.comments || 'No comments provided'}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <AdvanceCategoryModal isOpen={showCats} onClose={() => setShowCats(false)} />
    </div>
  )
}

function DetailItem({ label, value, highlight, status }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 underline uppercase tracking-tight">{label}</p>
      <p className={`text-sm font-semibold ${
        highlight ? 'text-blue-600 text-base' : 
        status ? (value === 'APPROVED' || value === 'DISBURSED' || value === 'SETTLED' ? 'text-green-600' : 'text-amber-600') :
        'text-[#172B4D]'
      }`}>
        {value}
      </p>
    </div>
  )
}
