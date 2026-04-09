import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useInvoices } from '../../queries/finance/financeQuery'

export default function InvoiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, isLoading } = useInvoices({})
  const rows = data?.results || []
  const invoice = rows.find((r) => String(r.id) === String(id))

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
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-[#172B4D]">Invoice {invoice.invoice_number}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Customer:</span> {invoice.billing_company_name || '-'}</div>
                <div><span className="text-gray-500">Status:</span> {invoice.status}</div>
                <div><span className="text-gray-500">Invoice Date:</span> {invoice.invoice_date || '-'}</div>
                <div><span className="text-gray-500">Due Date:</span> {invoice.due_date || '-'}</div>
                <div><span className="text-gray-500">Total:</span> {invoice.total_amount}</div>
                <div><span className="text-gray-500">Amount Due:</span> {invoice.amount_due}</div>
              </div>
              <div className="border-t pt-4 text-sm text-gray-600">Tabs planned: Summary, Line Items, Credit Notes, Payments.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
