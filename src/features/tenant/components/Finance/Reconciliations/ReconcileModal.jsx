import React, { useState, useEffect } from 'react'
import { X, Search, Trash2 } from 'lucide-react'
import { useInvoices, useCustomerPayments, useReconcilePayment, useUpdateReconciliation, useDeleteReconciliation } from '../../../queries/finance/financeQuery'
import { toast } from 'react-hot-toast'

export default function ReconcileModal({ isOpen, onClose, editData = null }) {
  const [invoiceId, setInvoiceId] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [amount, setAmount] = useState('')

  // Pre-fill on edit
  useEffect(() => {
    if (editData) {
      setInvoiceId(editData.invoice_id || '')
      setPaymentId(editData.customer_payment || '')
      setAmount(editData.amount_applied || '')
    } else {
      setInvoiceId('')
      setPaymentId('')
      setAmount('')
    }
  }, [editData, isOpen])

  // Fetch mostly active/unreconciled data if possible. Assuming standard GET params.
  const { data: invData, isLoading: invLoading } = useInvoices({ limit: 100 })
  const { data: payData, isLoading: payLoading } = useCustomerPayments({ limit: 100 })
  const { mutate: reconcile, isPending } = useReconcilePayment()
  const { mutate: updateRecon, isPending: isUpdating } = useUpdateReconciliation()
  const { mutate: deleteRecon, isPending: isDeleting } = useDeleteReconciliation()

  if (!isOpen) return null

  const invoices = invData?.results || (Array.isArray(invData) ? invData : [])
  const payments = payData?.results || (Array.isArray(payData) ? payData : [])

  const selectedInvoice = invoices.find(i => i.id === invoiceId)
  const selectedPayment = payments.find(p => p.id === paymentId)

  // Max amount you could apply is min of (invoice pending, payment unapplied). 
  // We'll let the user type, but show hints.

  const handleDelete = () => {
    if (!editData) return
    if (window.confirm("Are you sure you want to delete this reconciliation? This will un-apply the payment.")) {
      deleteRecon(editData.id, {
        onSuccess: () => {
          onClose()
        }
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!invoiceId || !paymentId || !amount || Number(amount) <= 0) {
      toast.error('Please fill in all fields correctly.')
      return
    }

    const payload = {
      customer_payment_id: paymentId, 
      invoice_id: invoiceId, 
      amount_applied: Number(amount).toFixed(2)
    }

    if (editData) {
      updateRecon({ id: editData.id, data: payload }, {
        onSuccess: () => onClose()
      })
    } else {
      reconcile(payload, {
        onSuccess: () => onClose()
      })
    }
  }

  const loading = isPending || isUpdating || isDeleting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in shrink-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden relative border border-gray-100/50">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{editData ? 'Edit Allocation' : 'New Reconciliation'}</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">{editData ? 'Update applied amount or delete allocation' : 'Apply a recorded payment to an invoice'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Payment Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Customer Payment</label>
            <div className="relative group">
              <select 
                value={paymentId} 
                onChange={e => setPaymentId(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer"
              >
                <option value="">Select a payment...</option>
                {payments.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.reference_number || p.id.split('-')[0]} • ₹{(parseFloat(p.amount) || parseFloat(p.received_amount) || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                <Search size={16} />
              </div>
            </div>
            {selectedPayment && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-tight">
                  Un-reconciled: ₹{(parseFloat(selectedPayment.unapplied_amount || selectedPayment.amount) || 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Invoice Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Invoice</label>
            <div className="relative group">
              <select 
                value={invoiceId} 
                onChange={e => setInvoiceId(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer"
              >
                <option value="">Select an invoice...</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number || inv.id.split('-')[0]} • ₹{(parseFloat(inv.total_amount) || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                <Search size={16} />
              </div>
            </div>
            {selectedInvoice && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <p className="text-[11px] text-blue-700 font-bold uppercase tracking-tight">
                  Pending: ₹{(parseFloat(selectedInvoice.pending_amount || selectedInvoice.total_amount) || 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Amount Applied */}
          <div className="pt-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Amount to Apply (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">₹</span>
              <input 
                type="number" 
                min="0.01" 
                step="0.01" 
                placeholder="0.00"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xl font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none placeholder:text-gray-300" 
              />
            </div>
          </div>

          <div className="pt-6 flex w-full justify-between items-center bg-white border-t border-gray-50 mt-4 rounded-b-2xl">
            <div>
              {editData && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                  title="Delete Reconciliation"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={loading || payLoading || invLoading} className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm bg-[#0052CC] text-white hover:bg-blue-700 hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
                {editData ? (isUpdating ? 'Updating...' : 'Save Changes') : (isPending ? 'Reconciling...' : 'Confirm Reconciliation')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
