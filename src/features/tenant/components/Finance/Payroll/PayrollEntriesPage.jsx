import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Coins } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import { useMarkPayrollEntryPaid, usePayrollEntries } from '../../../queries/finance/financeQuery'
import { useDrivers } from '../../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../../Drivers/common/utils'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollEntriesPage() {
  const { periodId } = useParams()
  const navigate = useNavigate()
  const params = useMemo(() => ({ payroll_period: periodId, page_size: 200 }), [periodId])
  const { data, isLoading, refetch } = usePayrollEntries(params)
  const { data: driversData } = useDrivers({ page_size: 1000 })
  const markPaid = useMarkPayrollEntryPaid()
  const rows = asList(data)
  const drivers = asList(driversData)

  const stats = useMemo(() => ([
    { label: 'Total', value: rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.payment_status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Paid', value: rows.filter((r) => r.payment_status === 'PAID').length, className: 'text-green-600' },
  ]), [rows])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate('/tenant/dashboard/finance/payroll')}
          className="inline-flex items-center gap-2 text-[#0052CC] text-sm font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Payroll
        </button>
        <FinanceListPage
          embedded
          showSearch={false}
          title="Payroll Entries"
          subtitle={`Payroll entries for period ${periodId?.slice(0, 8).toUpperCase()}…`}
          onRefresh={refetch}
          isLoading={isLoading}
          stats={stats}
          rows={rows}
          columns={[
            {
              key: 'employee_id',
              title: 'Employee',
              render: (eid, row) => {
                const uid = row.employee_id || row.driver_id || row.user_id
                const d = drivers.find(drv => drv.user_id === uid || drv.id === uid)
                return d ? getDriverName(d) : String(uid || '-').slice(0, 12)
              }
            },
            { key: 'gross_pay', title: 'Gross', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
            { key: 'deductions', title: 'Deductions', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
            { key: 'net_pay', title: 'Net Pay', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
            { key: 'payment_status', title: 'Status' },
          ]}
          rowActions={(row) =>
            row.payment_status === 'PENDING' ? (
              <button
                type="button"
                disabled={markPaid.isPending}
                onClick={() => markPaid.mutate(row.id, { onSuccess: () => refetch() })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50 transition-all border border-transparent"
              >
                <Coins size={13} /> Mark Paid
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-50 text-gray-400">Paid</span>
            )
          }
        />
      </div>
    </div>
  )
}
