import React, { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useCreateInvoice,
  useCreateInvoiceLineItem,
  useGenerateConsolidatedInvoice,
  useGenerateInvoiceFromTrip,
  useInvoiceEligibleTrips,
  useInvoices,
  useTripsLookup,
} from '../../../queries/finance/financeQuery'
import { useCustomers } from '../../../queries/customers/customersQuery'

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
    subtotal: '',
    tax_amount: '',
    total_amount: '',
    amount_paid: '',
    amount_due: '',
    payment_terms: '',
    notes: '',
    line_items: [],
  })

  const handleAddLineItem = () => {
    setManualForm(prev => ({
      ...prev,
      line_items: [...prev.line_items, {
        trip_id: '',
        lr_number: '',
        description: '',
        freight_amount: '',
        detention_amount: '',
        unloading_amount: '',
        incentive_amount: '',
        damage_deduction: '',
        other_charges: '',
        tax_rate: '',
        tax_amount: '',
        line_total: ''
      }]
    }))
  }

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...manualForm.line_items]
    newItems[index] = { ...newItems[index], [field]: value }

    const item = newItems[index]
    const baseAmount =
      parseFloat(item.freight_amount) +
      parseFloat(item.detention_amount) +
      parseFloat(item.unloading_amount) +
      parseFloat(item.incentive_amount) +
      parseFloat(item.other_charges) -
      parseFloat(item.damage_deduction)

    if (field !== 'tax_amount' && field !== 'line_total') {
      const taxRate = parseFloat(item.tax_rate)
      const taxAmt = baseAmount * (taxRate / 100)
      item.tax_amount = taxAmt.toFixed(2)
      item.line_total = (baseAmount + taxAmt).toFixed(2)
    }

    const overallSubtotal = newItems.reduce((sum, it) => {
      return sum + (parseFloat(it.freight_amount) + parseFloat(it.detention_amount) + parseFloat(it.unloading_amount) + parseFloat(it.incentive_amount) + parseFloat(it.other_charges) - parseFloat(it.damage_deduction));
    }, 0);
    const overallTax = newItems.reduce((sum, it) => sum + parseFloat(it.tax_amount), 0);
    const overallTotal = newItems.reduce((sum, it) => sum + parseFloat(it.line_total), 0);

    setManualForm({
      ...manualForm,
      line_items: newItems,
      subtotal: overallSubtotal.toFixed(2),
      tax_amount: overallTax.toFixed(2),
      total_amount: overallTotal.toFixed(2),
      amount_due: (overallTotal - parseFloat(manualForm.amount_paid)).toFixed(2)
    })
  }

  const handleRemoveLineItem = (index) => {
    setManualForm(prev => {
      const newItems = prev.line_items.filter((_, i) => i !== index);
      const overallSubtotal = newItems.reduce((sum, it) => sum + (parseFloat(it.freight_amount) + parseFloat(it.detention_amount || 0) + parseFloat(it.unloading_amount || 0) + parseFloat(it.incentive_amount || 0) + parseFloat(it.other_charges || 0) - parseFloat(it.damage_deduction || 0)), 0);
      const overallTax = newItems.reduce((sum, it) => sum + parseFloat(it.tax_amount), 0);
      const overallTotal = newItems.reduce((sum, it) => sum + parseFloat(it.line_total), 0);

      return {
        ...prev,
        line_items: newItems,
        subtotal: overallSubtotal.toFixed(2),
        tax_amount: overallTax.toFixed(2),
        total_amount: overallTotal.toFixed(2),
        amount_due: (overallTotal - parseFloat(prev.amount_paid)).toFixed(2)
      }
    })
  }
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
  const createLineItem = useCreateInvoiceLineItem()
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
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[#172B4D]">Create draft invoice</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Invoice #</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Invoice #" value={manualForm.invoice_number} onChange={(e) => setManualForm({ ...manualForm, invoice_number: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Link to Trip (Optional)</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={manualForm.trip_id}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const selectedT = allTripRows.find(t => String(t.id) === String(tId));

                    if (!tId || !selectedT) {
                      setManualForm({ ...manualForm, trip_id: '' });
                      return;
                    }

                    let customerUpdates = {};
                    const custId = selectedT.billing_customer_id || selectedT.customer_id || selectedT.customer;
                    if (custId) {
                       const cust = allCustomers.find(c => String(c.id) === String(custId));
                       customerUpdates = {
                          billing_customer_id: custId,
                          billing_company_name: cust?.legal_name || cust?.customer_code || selectedT.billing_company_name || selectedT.customer_name || ''
                       }
                    }

                    let itemsUpdates = [...manualForm.line_items];
                    const freight = selectedT.total_bill_amount || selectedT.booked_price || 0;

                    if (itemsUpdates.length === 0) {
                      itemsUpdates.push({
                        trip_id: tId,
                        lr_number: selectedT.lr_number || '',
                        description: `Trip charge for ${selectedT.trip_number || ''}`,
                        freight_amount: freight,
                        detention_amount: 0,
                        unloading_amount: 0,
                        incentive_amount: 0,
                        other_charges: 0,
                        damage_deduction: 0,
                        tax_rate: 0,
                        tax_amount: 0,
                        line_total: freight
                      })
                    } else if (itemsUpdates.length === 1) {
                      const baseAmount = parseFloat(freight) + parseFloat(itemsUpdates[0].detention_amount || 0) + parseFloat(itemsUpdates[0].unloading_amount || 0) + parseFloat(itemsUpdates[0].incentive_amount || 0) + parseFloat(itemsUpdates[0].other_charges || 0) - parseFloat(itemsUpdates[0].damage_deduction || 0);
                      const taxAmt = baseAmount * (parseFloat(itemsUpdates[0].tax_rate || 0) / 100);

                      itemsUpdates[0] = {
                        ...itemsUpdates[0],
                        trip_id: tId,
                        lr_number: selectedT.lr_number || '',
                        description: `Trip charge for ${selectedT.trip_number || ''}`,
                        freight_amount: freight,
                        tax_amount: taxAmt.toFixed(2),
                        line_total: (baseAmount + taxAmt).toFixed(2)
                      }
                    }

                    const overallSubtotal = itemsUpdates.reduce((sum, it) => sum + parseFloat(it.freight_amount || 0) + parseFloat(it.detention_amount || 0) + parseFloat(it.unloading_amount || 0) + parseFloat(it.incentive_amount || 0) + parseFloat(it.other_charges || 0) - parseFloat(it.damage_deduction || 0), 0);
                    const overallTax = itemsUpdates.reduce((sum, it) => sum + parseFloat(it.tax_amount || 0), 0);
                    const overallTotal = itemsUpdates.reduce((sum, it) => sum + parseFloat(it.line_total || 0), 0);

                    setManualForm({
                      ...manualForm,
                      trip_id: tId,
                      ...customerUpdates,
                      line_items: itemsUpdates,
                      subtotal: overallSubtotal.toFixed(2),
                      tax_amount: overallTax.toFixed(2),
                      total_amount: overallTotal.toFixed(2),
                      amount_due: (overallTotal - parseFloat(manualForm.amount_paid || 0)).toFixed(2)
                    });
                  }}
                >
                  <option value="">Select Trip</option>
                  {allTripOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Invoice Date</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.invoice_date} onChange={(e) => setManualForm({ ...manualForm, invoice_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Due Date</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.due_date} onChange={(e) => setManualForm({ ...manualForm, due_date: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Billing Customer</label>
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
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Company Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  placeholder="Company name (auto-filled)"
                  readOnly
                  value={manualForm.billing_company_name}
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Line Items</label>
                <button type="button" onClick={handleAddLineItem} className="text-xs font-bold text-[#0052CC] hover:underline">
                  + Add Item
                </button>
              </div>
              {manualForm.line_items.length === 0 && (
                <div className="text-xs text-gray-500 italic mb-2">No line items added.</div>
              )}
              {manualForm.line_items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4 bg-white shadow-sm relative">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                    <h4 className="font-bold text-[#172B4D] text-sm">Item {index + 1}</h4>
                    <button type="button" onClick={() => handleRemoveLineItem(index)} className="text-red-500 font-bold hover:text-red-700 text-xs flex items-center gap-1">
                      ✕ Remove
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Link to Trip</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none bg-white"
                          value={item.trip_id || ''}
                          onChange={(e) => {
                            const tId = e.target.value;
                            const selectedT = allTripRows.find(t => String(t.id) === String(tId));

                            let customerUpdates = {};
                            const custId = selectedT?.billing_customer_id || selectedT?.customer_id || selectedT?.customer;
                            if (selectedT && custId && !manualForm.billing_customer_id) {
                               const cust = allCustomers.find(c => String(c.id) === String(custId));
                               customerUpdates = {
                                  billing_customer_id: custId,
                                  billing_company_name: cust?.legal_name || cust?.customer_code || selectedT.billing_company_name || selectedT.customer_name || ''
                               }
                            }

                            const newItems = [...manualForm.line_items]
                            newItems[index] = { ...newItems[index], trip_id: tId }

                            if (selectedT) {
                              if (!newItems[index].lr_number && selectedT.lr_number) newItems[index].lr_number = selectedT.lr_number;
                              if (!newItems[index].description) newItems[index].description = `Trip charge for ${selectedT.trip_number || ''}`;

                              const freight = selectedT.total_bill_amount || selectedT.booked_price || 0;
                              if (freight && newItems[index].freight_amount === 0) {
                                newItems[index].freight_amount = freight;
                                // Fast recalculate base
                                const baseAmount = parseFloat(freight) + parseFloat(newItems[index].detention_amount || 0) + parseFloat(newItems[index].unloading_amount || 0) + parseFloat(newItems[index].incentive_amount || 0) + parseFloat(newItems[index].other_charges || 0) - parseFloat(newItems[index].damage_deduction || 0);
                                const taxAmt = baseAmount * (parseFloat(newItems[index].tax_rate || 0) / 100);
                                newItems[index].tax_amount = taxAmt.toFixed(2);
                                newItems[index].line_total = (baseAmount + taxAmt).toFixed(2);
                              }
                            }
                            setManualForm({ ...manualForm, ...customerUpdates, line_items: newItems })
                          }}
                        >
                          <option value="">No Trip Linked</option>
                          {allTripOptions.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">LR Number</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none" placeholder="e.g. LR-2026..." value={item.lr_number || ''} onChange={(e) => handleLineItemChange(index, 'lr_number', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] outline-none" placeholder="Trip charge..." value={item.description || ''} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Charges & Additions</div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Freight</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm" value={item.freight_amount} onChange={(e) => handleLineItemChange(index, 'freight_amount', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Detention</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm" value={item.detention_amount} onChange={(e) => handleLineItemChange(index, 'detention_amount', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Unloading</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm" value={item.unloading_amount} onChange={(e) => handleLineItemChange(index, 'unloading_amount', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Incentive</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm" value={item.incentive_amount} onChange={(e) => handleLineItemChange(index, 'incentive_amount', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Other</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm" value={item.other_charges} onChange={(e) => handleLineItemChange(index, 'other_charges', e.target.value)} />
                        </div>
                      </div>

                      <div className="border-t border-gray-200 my-2"></div>

                      <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Deductions & Taxes</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-red-600 block mb-1">Damage Ded.</label>
                          <input type="number" className="w-full border-red-200 rounded-md px-2 py-1.5 text-sm text-red-600 focus:border-red-400 outline-none" value={item.damage_deduction} onChange={(e) => handleLineItemChange(index, 'damage_deduction', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Tax Rate (%)</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm" value={item.tax_rate} onChange={(e) => handleLineItemChange(index, 'tax_rate', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Tax Amt</label>
                          <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm bg-gray-200/50 cursor-not-allowed" readOnly value={item.tax_amount} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#0052CC] block mb-1">Line Total</label>
                          <input type="number" className="w-full border-[#0052CC]/30 rounded-md px-2 py-1.5 text-sm bg-blue-50 font-bold text-[#0052CC] cursor-not-allowed" readOnly value={item.line_total} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Subtotal</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.subtotal} onChange={(e) => setManualForm({ ...manualForm, subtotal: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Tax Amount</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.tax_amount} onChange={(e) => setManualForm({ ...manualForm, tax_amount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Total Amount</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.total_amount} onChange={(e) => setManualForm({ ...manualForm, total_amount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Amount Paid</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.amount_paid} onChange={(e) => {
                  const amtPaid = parseFloat(e.target.value || 0);
                  const total = parseFloat(manualForm.total_amount || 0);
                  setManualForm({
                    ...manualForm,
                    amount_paid: e.target.value,
                    amount_due: (total - amtPaid).toFixed(2)
                  })
                }} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Amount Due</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.amount_due} onChange={(e) => setManualForm({ ...manualForm, amount_due: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Terms</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.payment_terms} onChange={(e) => setManualForm({ ...manualForm, payment_terms: e.target.value })}></textarea>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}></textarea>
              </div>
            </div>
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
                      subtotal: manualForm.subtotal || "0.00",
                      tax_amount: manualForm.tax_amount || "0.00",
                      total_amount: manualForm.total_amount || "0.00",
                      amount_paid: manualForm.amount_paid || "0.00",
                      amount_due: manualForm.amount_due || "0.00",
                      payment_terms: manualForm.payment_terms || "",
                      notes: manualForm.notes || "",
                      line_items: manualForm.line_items,
                      status: 'DRAFT',
                    },
                    {
                      onSuccess: async (res) => {
                        const invoiceId = res?.id || res?.data?.id;
                        if (invoiceId && manualForm.line_items.length > 0) {
                          try {
                            await Promise.all(
                              manualForm.line_items.map(item => createLineItem.mutateAsync({ ...item, invoice: invoiceId }))
                            );
                          } catch (err) {
                            console.error("Failed to create some line items", err);
                          }
                        }
                        setShowCreate(false);
                        refetch();
                      }
                    },
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
