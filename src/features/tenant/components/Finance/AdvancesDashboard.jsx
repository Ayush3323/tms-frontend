import React, { useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from './FinanceListPage'
import { useAdvances, useApproveAdvance, useDisburseAdvance, useRejectAdvance } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function AdvancesDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useAdvances(search ? { search } : {})
  const approve = useApproveAdvance()
  const reject = useRejectAdvance()
  const disburse = useDisburseAdvance()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Approved', value: rows.filter((r) => r.status === 'APPROVED').length, className: 'text-indigo-600' },
    { label: 'Disbursed', value: rows.filter((r) => r.status === 'DISBURSED').length, className: 'text-green-600' },
    { label: 'Settled', value: rows.filter((r) => r.status === 'SETTLED').length, className: 'text-teal-600' },
  ]), [data?.count, rows])

  return (
    <FinanceListPage
      title="Advances"
      subtitle="Manage request approvals, disbursements, and settlements."
      search={search}
      setSearch={setSearch}
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
      rowActions={(row) => (
        <>
          <button type="button" onClick={() => navigate(`/tenant/dashboard/finance/advances/${row.id}`)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all">
            View
          </button>
          {row.status === 'PENDING' && (
            <>
              <button type="button" onClick={() => approve.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg"><CheckCircle2 size={16} /></button>
              <button type="button" onClick={() => reject.mutate({ id: row.id, rejection_reason: 'Rejected from dashboard' })} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><XCircle size={16} /></button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <button type="button" onClick={() => disburse.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all">
              Disburse
            </button>
          )}
        </>
      )}
    />
  )
}
