import React, { useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import { useCancelInvoice, useGenerateInvoiceFromTrip, useInvoices, usePostInvoice } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function InvoicesDashboard() {
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useInvoices(search ? { search } : {})
  const postInvoice = usePostInvoice()
  const cancelInvoice = useCancelInvoice()
  const generateFromTrip = useGenerateInvoiceFromTrip()
  const rows = asList(data)

  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Draft', value: rows.filter((r) => r.status === 'DRAFT').length, className: 'text-amber-600' },
    { label: 'Sent', value: rows.filter((r) => r.status === 'SENT').length, className: 'text-indigo-600' },
    { label: 'Overdue', value: rows.filter((r) => r.status === 'OVERDUE').length, className: 'text-red-600' },
    { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <FinanceListPage
      title="Invoices"
      subtitle="Manage invoice lifecycle, due amounts, and posting workflow."
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      stats={stats}
      rows={rows}
      columns={[
        { key: 'invoice_number', title: 'Invoice #' },
        { key: 'billing_company_name', title: 'Customer' },
        { key: 'invoice_date', title: 'Invoice Date' },
        { key: 'due_date', title: 'Due Date' },
        { key: 'total_amount', title: 'Total Amount' },
        { key: 'amount_due', title: 'Amount Due' },
        { key: 'status', title: 'Status' },
      ]}
      actions={(
        <button
          type="button"
          onClick={() => {
            const tripId = window.prompt('Enter Trip ID to generate invoice')
            if (tripId) generateFromTrip.mutate(tripId)
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all"
        >
          Generate from Trip
        </button>
      )}
      rowActions={(row) => (
        <>
          {row.status === 'DRAFT' && (
            <button type="button" onClick={() => postInvoice.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg">
              <CheckCircle2 size={16} />
            </button>
          )}
          {['DRAFT', 'SENT', 'OVERDUE'].includes(row.status) && (
            <button type="button" onClick={() => cancelInvoice.mutate(row.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg">
              <XCircle size={16} />
            </button>
          )}
        </>
      )}
    />
  )
}
