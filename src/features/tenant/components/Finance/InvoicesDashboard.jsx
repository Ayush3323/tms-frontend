import React, { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from './FinanceListPage'
import {
  useCreateInvoice,
  useGenerateConsolidatedInvoice,
  useGenerateInvoiceFromTrip,
  useInvoiceEligibleTrips,
  useInvoices,
  useTripsLookup,
} from '../../queries/finance/financeQuery'
import { useCustomers } from '../../queries/customers/customersQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function InvoicesDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedTripId, setSelectedTripId] = useState('')
  const [mode, setMode] = useState('trip')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedTripIds, setSelectedTripIds] = useState([])
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: allCustomersData } = useCustomers({ page_size: 1000 })
  const allCustomers = asList(allCustomersData)

  const [manualForm, setManualForm] = useState({
    invoice_number: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    billing_customer_id: '',
    billing_company_name: '',
    trip_id: '',
  })
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useInvoices(queryParams)
  const { data: tripsData, isLoading: tripsLoading } = useInvoiceEligibleTrips({ page_size: 200 })
  const { data: customerTripsData, isLoading: customerTripsLoading } = useInvoiceEligibleTrips({
    billing_customer_id: selectedCustomerId || undefined,
    page_size: 200,
  })
  const { data: allTripsData, isLoading: allTripsLoading } = useTripsLookup({ page_size: 200 })
  const generateFromTrip = useGenerateInvoiceFromTrip()
  const generateConsolidated = useGenerateConsolidatedInvoice()
  const createInvoice = useCreateInvoice()
  const rows = asList(data)
  const tripRows = asList(tripsData)
  const allTripRows = asList(allTripsData)
  const customerTripRows = asList(customerTripsData)
  const customerOptions = useMemo(() => {
    const seen = new Set()
    const opts = []
    for (const trip of tripRows) {
      const customerId = trip.billing_customer_id
      if (!customerId || seen.has(String(customerId))) continue
      seen.add(String(customerId))
      const name = trip.billing_company_name || String(customerId).slice(-8).toUpperCase()
      opts.push({ id: customerId, label: name })
    }
    return opts
  }, [tripRows])
  const tripOptions = useMemo(() => tripRows.map((trip) => {
    const tripNo = trip.trip_number || String(trip.id).slice(-8).toUpperCase()
    const route = [trip.origin_address, trip.destination_address].filter(Boolean).join(' -> ')
    return {
      id: trip.id,
      label: route ? `${tripNo} (${route})` : tripNo,
    }
  }), [tripRows])
  const allTripOptions = useMemo(() => allTripRows.map((trip) => {
    const tripNo = trip.trip_number || String(trip.id).slice(-8).toUpperCase()
    const route = [trip.origin_address, trip.destination_address].filter(Boolean).join(' -> ')
    return {
      id: trip.id,
      label: route ? `${tripNo} (${route})` : tripNo,
    }
  }), [allTripRows])
  const selectedTripPreviewTotal = useMemo(() => {
    const selected = customerTripRows.filter((trip) => selectedTripIds.includes(String(trip.id)))
    return selected.reduce((sum, trip) => sum + Number(trip.total_bill_amount || trip.booked_price || 0), 0)
  }, [customerTripRows, selectedTripIds])

  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Draft', value: rows.filter((r) => r.status === 'DRAFT').length, className: 'text-amber-600' },
    { label: 'Sent', value: rows.filter((r) => r.status === 'SENT').length, className: 'text-indigo-600' },
    { label: 'Overdue', value: rows.filter((r) => r.status === 'OVERDUE').length, className: 'text-red-600' },
    { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <>
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl border border-[#0052CC] text-[#0052CC] text-xs font-bold hover:bg-[#EBF3FF]"
          >
            Manual Invoice
          </button>
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value)
              setSelectedTripIds([])
              setSelectedCustomerId('')
            }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="trip">Trip Invoice</option>
            <option value="consolidated">Consolidated Invoice</option>
          </select>
          {mode === 'trip' ? (
            <>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="min-w-[280px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                disabled={tripsLoading || generateFromTrip.isPending}
              >
                <option value="">{tripsLoading ? 'Loading eligible trips...' : (tripOptions.length === 0 ? 'No eligible trips found' : 'Select Eligible Trip')}</option>
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
            </>
          ) : (
            <>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="min-w-[220px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
              >
                <option value="">Select Billing Customer</option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.label}</option>
                ))}
              </select>
              <select
                multiple
                value={selectedTripIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value)
                  setSelectedTripIds(values)
                }}
                className="min-w-[320px] h-20 px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
                disabled={!selectedCustomerId || customerTripsLoading}
              >
                {customerTripRows.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {(trip.trip_number || String(trip.id).slice(-8).toUpperCase())} - {trip.total_bill_amount || 0}
                  </option>
                ))}
              </select>
              <div className="text-[11px] font-semibold text-gray-600 min-w-[120px]">
                Preview Total: {selectedTripPreviewTotal.toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!selectedCustomerId || selectedTripIds.length === 0) return
                  generateConsolidated.mutate({
                    billing_customer_id: selectedCustomerId,
                    trip_ids: selectedTripIds,
                  })
                }}
                disabled={!selectedCustomerId || selectedTripIds.length === 0 || generateConsolidated.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all disabled:opacity-50"
              >
                Generate Consolidated
              </button>
            </>
          )}
        </div>
      )}
      rowActions={(row) => (
        <button
          type="button"
          onClick={() => navigate(`/tenant/dashboard/finance/invoices/${row.id}`)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all inline-flex items-center gap-1"
          title="View Invoice"
        >
          <Eye size={13} />
          View
        </button>
      )}
    />
    {showCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl space-y-3">
          <h3 className="text-lg font-bold text-[#172B4D]">Create draft invoice</h3>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Invoice #" value={manualForm.invoice_number} onChange={(e) => setManualForm({ ...manualForm, invoice_number: e.target.value })} />
          <div className="flex gap-2">
            <input type="date" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={manualForm.invoice_date} onChange={(e) => setManualForm({ ...manualForm, invoice_date: e.target.value })} />
            <input type="date" className="flex-1 border rounded-lg px-3 py-2 text-sm" value={manualForm.due_date} onChange={(e) => setManualForm({ ...manualForm, due_date: e.target.value })} />
          </div>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            value={manualForm.billing_customer_id}
            onChange={(e) => {
              const custId = e.target.value
              const cust = allCustomers.find(c => String(c.id) === String(custId))
              setManualForm({
                ...manualForm,
                billing_customer_id: custId,
                billing_company_name: cust?.legal_name || cust?.customer_code || ''
              })
            }}
          >
            <option value="">Select Billing Customer</option>
            {allCustomers.map(c => (
              <option key={c.id} value={c.id}>{c.legal_name || c.customer_code || c.id.slice(-6)}</option>
            ))}
          </select>
          <input 
            className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" 
            placeholder="Company name (auto-filled)" 
            readOnly
            value={manualForm.billing_company_name} 
          />
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            value={manualForm.trip_id}
            onChange={(e) => setManualForm({ ...manualForm, trip_id: e.target.value })}
          >
            <option value="">Link to Trip (Optional)</option>
            {allTripOptions.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#0052CC] text-white text-sm font-bold"
              disabled={!manualForm.invoice_number || !manualForm.billing_customer_id || createInvoice.isPending}
              onClick={() => {
                createInvoice.mutate(
                  {
                    invoice_number: manualForm.invoice_number,
                    invoice_date: manualForm.invoice_date,
                    due_date: manualForm.due_date || null,
                    billing_customer_id: manualForm.billing_customer_id,
                    billing_company_name: manualForm.billing_company_name,
                    trip_id: manualForm.trip_id || null,
                    status: 'DRAFT',
                  },
                  { onSuccess: () => { setShowCreate(false); refetch() } },
                )
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
