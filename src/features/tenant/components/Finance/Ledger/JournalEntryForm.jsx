import React, { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useCreateJournalEntry } from '../../../queries/finance/financeQuery'

export default function JournalEntryForm({ isOpen, onClose, accounts = [] }) {
  const mutation = useCreateJournalEntry()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState([
    { id: 1, account_id: '', debit: '', credit: '', memo: '' },
    { id: 2, account_id: '', debit: '', credit: '', memo: '' }
  ])

  if (!isOpen) return null

  const addLine = () => setLines([...lines, { id: Date.now(), account_id: '', debit: '', credit: '', memo: '' }])
  const removeLine = (id) => setLines(lines.filter(l => l.id !== id))
  
  const handleLineChange = (id, field, value) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value }
        if (field === 'debit' && value) updated.credit = '' 
        if (field === 'credit' && value) updated.debit = '' 
        return updated
      }
      return l
    }))
  }

  const handlePost = () => {
    if (!isBalanced) return
    mutation.mutate({
      entry_date: date,
      reference_type: reference,
      memo,
      lines: lines.map(l => ({
        account: l.account_id,
        debit: l.debit || "0.00",
        credit: l.credit || "0.00",
        memo: l.memo
      }))
    }, {
      onSuccess: () => onClose()
    })
  }

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Journal Entry</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Manual voucher entry for double ledger</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Entry Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Reference #</label>
              <input type="text" placeholder="e.g. VCH-001" value={reference} onChange={e => setReference(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Internal Memo</label>
              <input type="text" placeholder="Short description" value={memo} onChange={e => setMemo(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Account</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-32">Debit (₹)</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-32">Credit (₹)</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <select value={line.account_id} onChange={e => handleLineChange(line.id, 'account_id', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-colors">
                        <option value="">Select Account...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input type="text" placeholder="Line memo..." value={line.memo} onChange={e => handleLineChange(line.id, 'memo', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-colors" />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={line.debit} onChange={e => handleLineChange(line.id, 'debit', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-emerald-200 focus:border-emerald-500 rounded-lg text-sm text-right text-emerald-700 font-bold outline-none transition-colors disabled:opacity-50" disabled={!!line.credit} />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={line.credit} onChange={e => handleLineChange(line.id, 'credit', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-rose-200 focus:border-rose-500 rounded-lg text-sm text-right text-rose-700 font-bold outline-none transition-colors disabled:opacity-50" disabled={!!line.debit} />
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => removeLine(line.id)} disabled={lines.length <= 2} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus size={16} /> Add Line
              </button>
              
              <div className="flex items-center gap-8 px-4 text-sm">
                <div className="flex flex-col items-end">
                   <span className="text-gray-500 font-bold text-xs uppercase">Total Debit</span>
                   <span className="text-lg font-black text-emerald-600">{totalDebit.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-gray-500 font-bold text-xs uppercase">Total Credit</span>
                   <span className="text-lg font-black text-rose-600">{totalCredit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Validation Alert */}
          {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <div className="text-amber-800 font-medium text-sm">
                <strong>Out of balance!</strong> Total debits must equal total credits before you can post this entry. 
                Difference: <span className="font-bold border-b border-amber-800">₹{Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              disabled={!isBalanced || mutation.isPending}
              onClick={handlePost}
              className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm ${
                isBalanced && !mutation.isPending 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {mutation.isPending ? 'Posting...' : 'Post Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
