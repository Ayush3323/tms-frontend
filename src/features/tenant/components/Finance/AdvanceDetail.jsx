import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAdvanceDetail } from '../../queries/finance/financeQuery'

export default function AdvanceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, isLoading } = useAdvanceDetail(id)

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">User:</span> {data.user_id}</div>
                <div><span className="text-gray-500">Category:</span> {data.category}</div>
                <div><span className="text-gray-500">Request Date:</span> {data.request_date}</div>
                <div><span className="text-gray-500">Amount:</span> {data.amount}</div>
                <div><span className="text-gray-500">Status:</span> {data.status}</div>
                <div><span className="text-gray-500">Trip:</span> {data.trip_id || '-'}</div>
              </div>
              <div className="border-t pt-4 text-sm text-gray-600">Tabs planned: Details, Disbursement, Repayments, Approval History.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
