import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { advanceApi } from '../../api/finance/financeEndpoint'
import {
  useAdvanceApprovals,
  useAdvanceDetail,
  useAdvanceDisbursements,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function AdvanceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState('details')
  const { data, isLoading } = useAdvanceDetail(id)
  const { data: disbData } = useAdvanceDisbursements(id ? { request: id } : {})
  const { data: apprData } = useAdvanceApprovals(id ? { request: id } : {})
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
        <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-[#0052CC] text-sm font-semibold">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading advance...</p>
          ) : !data ? (
            <p className="text-sm text-gray-500">Advance not found.</p>
          ) : (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-[#172B4D]">Advance {String(data.id).slice(-8).toUpperCase()}</h1>
              <div className="flex gap-2 border-b pb-2">
                {['details', 'disbursement', 'repayments', 'approvals'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${tab === t ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">User:</span> {data.user_id}</div>
                  <div><span className="text-gray-500">Category:</span> {data.category}</div>
                  <div><span className="text-gray-500">Request Date:</span> {data.request_date}</div>
                  <div><span className="text-gray-500">Amount:</span> {data.amount}</div>
                  <div><span className="text-gray-500">Status:</span> {data.status}</div>
                  <div><span className="text-gray-500">Trip:</span> {data.trip_id || '-'}</div>
                  {data.rejection_reason ? <div className="md:col-span-2 text-red-600">Rejection: {data.rejection_reason}</div> : null}
                </div>
              )}
              {tab === 'disbursement' && (
                <div className="text-sm space-y-2">
                  {disbursements.length === 0 ? <p className="text-gray-500">No disbursement yet.</p> : disbursements.map((d) => (
                    <div key={d.id} className="border rounded-lg p-3 text-xs">
                      <p>Date: {d.disbursement_date} | Amount: {d.amount_disbursed} | Mode: {d.payment_mode}</p>
                      <p className="text-gray-500">Ref: {d.payment_reference || '-'}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'repayments' && (
                <div className="text-sm space-y-2">
                  {repaymentQueries.some((q) => q.isLoading) ? <p className="text-gray-500">Loading repayments...</p> : null}
                  {repayments.length === 0 && !repaymentQueries.some((q) => q.isLoading) ? <p className="text-gray-500">No repayments.</p> : repayments.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3 text-xs">
                      <p>Date: {r.repayment_date} | Amount: {r.amount}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'approvals' && (
                <div className="text-sm space-y-2">
                  {approvals.length === 0 ? <p className="text-gray-500">No approval rows.</p> : approvals.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 text-xs">
                      <p>Level: {a.approval_level} | Action: {a.action} | {a.approval_date}</p>
                      <p className="text-gray-500">{a.comments}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
