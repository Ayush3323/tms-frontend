import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import FinanceListPage from './FinanceListPage'
import {
  useCancelInvoice,
  useGenerateInvoiceFromTrip,
  useInvoices,
  useMarkInvoiceOverdue,
  usePostInvoice,
  useTripsLookup,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function InvoicesDashboard() {
  const [search, setSearch] = useState('')
  const [selectedTripId, setSelectedTripId] = useState('')
  const [status, setStatus] = useState('')
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useInvoices(queryParams)
  const { data: tripsData, isLoading: tripsLoading } = useTripsLookup({ page_size: 200 })
  const postInvoice = usePostInvoice()
  const cancelInvoice = useCancelInvoice()
  const markOverdue = useMarkInvoiceOverdue()
  const generateFromTrip = useGenerateInvoiceFromTrip()
  const rows = asList(data)
  const tripRows = asList(tripsData)
  const tripOptions = useMemo(() => tripRows.map((trip) => {
    const tripNo = trip.trip_number || String(trip.id).slice(-8).toUpperCase()
    const route = [trip.origin_address, trip.destination_address].filter(Boolean).join(' -> ')
    return {
      id: trip.id,
      label: route ? `${tripNo} (${route})` : tripNo,
    }
  }), [tripRows])

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
      secondaryFilters={(
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      )}
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
        <div className="flex items-center gap-2">
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="min-w-[280px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            disabled={tripsLoading || generateFromTrip.isPending}
          >
            <option value="">{tripsLoading ? 'Loading trips...' : 'Select Trip'}</option>
            {tripOptions.map((trip) => (
              <option key={trip.id} value={trip.id}>{trip.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selectedTripId && generateFromTrip.mutate(selectedTripId)}
            disabled={!selectedTripId || generateFromTrip.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all disabled:opacity-50"
          >
            Generate from Trip
          </button>
        </div>
      )}
      rowActions={(row) => (
        <>
          {row.status === 'DRAFT' && (
            <button type="button" onClick={() => postInvoice.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg">
              <CheckCircle2 size={16} />
            </button>
          )}
          {['DRAFT', 'SENT', 'OVERDUE'].includes(row.status) && (
            <button
              type="button"
              disabled={cancelInvoice.isPending}
              onClick={() => window.confirm('Cancel this invoice?') && cancelInvoice.mutate(row.id)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-50"
            >
              <XCircle size={16} />
            </button>
          )}
          {['SENT', 'PARTIALLY_PAID'].includes(row.status) && (
            <button
              type="button"
              disabled={markOverdue.isPending}
              onClick={() => markOverdue.mutate(row.id)}
              className="p-2 text-gray-400 hover:text-amber-600 rounded-lg disabled:opacity-50"
              title="Mark Overdue"
            >
              <AlertTriangle size={16} />
            </button>
          )}
        </>
      )}
    />
  )
}
