import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, ReceiptText, XCircle } from 'lucide-react'

import {
  useApplyCreditNoteToInvoice,
  useCancelInvoice,
  useCreditNotes,
  useInvoiceDetail,
  useInvoiceLineItems,
  useMarkInvoiceOverdue,
  usePostInvoice,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: invoice, isLoading } = useInvoiceDetail(id)
  const { data: lineItemsData, isLoading: itemsLoading } = useInvoiceLineItems({ invoice: id })
  const { data: creditNotesData, isLoading: notesLoading } = useCreditNotes({ invoice: id })
  const postInvoice = usePostInvoice()
  const cancelInvoice = useCancelInvoice()
  const markOverdue = useMarkInvoiceOverdue()
  const applyCreditNote = useApplyCreditNoteToInvoice()
  const lineItems = asList(lineItemsData)
  const creditNotes = asList(creditNotesData)
  const unappliedCreditNotes = useMemo(
    () => creditNotes.filter((note) => String(note.status).toUpperCase() !== 'APPLIED'),
    [creditNotes],
  )

  const availableActions = useMemo(() => {
    if (!invoice) return []
    const status = String(invoice.status || '').toUpperCase()
    const actions = ['View details']
    if (status === 'DRAFT') actions.push('Post invoice')
    if (['DRAFT', 'SENT', 'OVERDUE'].includes(status)) actions.push('Cancel invoice')
    if (['SENT', 'PARTIALLY_PAID'].includes(status)) actions.push('Mark overdue')
    if (unappliedCreditNotes.length > 0) actions.push('Apply credit note')
    return actions
  }, [invoice, unappliedCreditNotes.length])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-[#0052CC] text-sm font-semibold">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading invoice...</p>
          ) : !invoice ? (
            <p className="text-sm text-gray-500">Invoice not found.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#172B4D]">Invoice {invoice.invoice_number}</h1>
                  <p className="text-sm text-gray-500 mt-1">Execute invoice lifecycle actions from this page.</p>
                </div>
                <div className="flex items-center gap-2">
                  {invoice.status === 'DRAFT' && (
                    <button type="button" onClick={() => postInvoice.mutate(invoice.id)} disabled={postInvoice.isPending} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold disabled:opacity-50">
                      <CheckCircle2 size={14} /> Post
                    </button>
                  )}
                  {['DRAFT', 'SENT', 'OVERDUE'].includes(invoice.status) && (
                    <button type="button" onClick={() => window.confirm('Cancel this invoice?') && cancelInvoice.mutate(invoice.id)} disabled={cancelInvoice.isPending} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold disabled:opacity-50">
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                  {['SENT', 'PARTIALLY_PAID'].includes(invoice.status) && (
                    <button type="button" onClick={() => markOverdue.mutate(invoice.id)} disabled={markOverdue.isPending} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold disabled:opacity-50">
                      <AlertTriangle size={14} /> Mark Overdue
                    </button>
                  )}
                  {unappliedCreditNotes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const options = unappliedCreditNotes.map((n) => `${n.id}:${n.credit_note_number || 'CN'}`).join('\n')
                        const selected = window.prompt(`Enter Credit Note ID to apply:\n${options}`)
                        if (selected) applyCreditNote.mutate({ id: invoice.id, creditNoteId: selected.trim() })
                      }}
                      disabled={applyCreditNote.isPending}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold disabled:opacity-50"
                    >
                      <ReceiptText size={14} /> Apply Credit Note
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Customer:</span> {invoice.billing_company_name || '-'}</div>
                <div><span className="text-gray-500">Status:</span> {invoice.status}</div>
                <div><span className="text-gray-500">Invoice Date:</span> {invoice.invoice_date || '-'}</div>
                <div><span className="text-gray-500">Due Date:</span> {invoice.due_date || '-'}</div>
                <div><span className="text-gray-500">Total:</span> {money(invoice.total_amount)}</div>
                <div><span className="text-gray-500">Amount Due:</span> {money(invoice.amount_due)}</div>
                <div><span className="text-gray-500">Amount Paid:</span> {money(invoice.amount_paid)}</div>
                <div><span className="text-gray-500">Tax:</span> {money(invoice.tax_amount)}</div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4 bg-gray-50/50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Actions on this Invoice</p>
                <div className="flex flex-wrap gap-2">
                  {availableActions.map((action) => (
                    <span key={action} className="px-2 py-1 rounded-full text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC]">{action}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-4">
                  <h2 className="text-sm font-bold text-[#172B4D] mb-3">Line Items</h2>
                  {itemsLoading ? (
                    <p className="text-xs text-gray-500">Loading line items...</p>
                  ) : lineItems.length === 0 ? (
                    <p className="text-xs text-gray-500">No line items.</p>
                  ) : (
                    <div className="space-y-2">
                      {lineItems.map((item) => (
                        <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                          <p className="text-xs font-bold text-[#172B4D]">{item.description || item.lr_number || 'Line item'}</p>
                          <p className="text-xs text-gray-500 mt-1">Trip: {item.trip_id || '-'}</p>
                          <p className="text-xs font-semibold text-gray-700 mt-1">Total: {money(item.line_total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-100 p-4">
                  <h2 className="text-sm font-bold text-[#172B4D] mb-3">Credit Notes</h2>
                  {notesLoading ? (
                    <p className="text-xs text-gray-500">Loading credit notes...</p>
                  ) : creditNotes.length === 0 ? (
                    <p className="text-xs text-gray-500">No credit notes.</p>
                  ) : (
                    <div className="space-y-2">
                      {creditNotes.map((note) => (
                        <div key={note.id} className="border border-gray-100 rounded-lg p-3">
                          <p className="text-xs font-bold text-[#172B4D]">{note.credit_note_number || String(note.id).slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-gray-500 mt-1">Status: {note.status}</p>
                          <p className="text-xs font-semibold text-gray-700 mt-1">Amount: {money(note.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
