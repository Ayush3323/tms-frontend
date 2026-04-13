import React, { useState } from 'react'
import { Search } from 'lucide-react'

import { useLRSettlement } from '../../queries/finance/financeQuery'

export default function LRSettlementPage() {
  const [tripId, setTripId] = useState('')
  const [q, setQ] = useState('')
  const { data, isLoading, isError, error, refetch } = useLRSettlement(q)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">LR Settlement (Excel parity)</h1>
          <p className="text-sm text-gray-500 mt-1">Load aggregated trip + finance data for one LR/trip.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-100 rounded-xl p-4">
          <input
            className="flex-1 min-w-[240px] border rounded-lg px-3 py-2 text-sm"
            placeholder="Trip UUID"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setQ(tripId.trim())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052CC] text-white text-sm font-bold"
          >
            <Search size={16} /> Load
          </button>
          <button type="button" onClick={() => refetch()} className="px-4 py-2 text-sm font-semibold text-gray-600">Refresh</button>
        </div>
        {isLoading && <p className="text-sm text-gray-500">Loading settlement...</p>}
        {isError && (
          <p className="text-sm text-red-600">{error?.response?.data?.detail || error?.message || 'Failed to load'}</p>
        )}
        {data && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full text-xs">
                <tbody>
                  {Object.entries(data).map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-600 whitespace-nowrap align-top">{k}</td>
                      <td className="px-3 py-2 text-gray-900 break-all">
                        {v && typeof v === 'object' ? (
                          <pre className="whitespace-pre-wrap text-[11px]">{JSON.stringify(v, null, 2)}</pre>
                        ) : String(v ?? '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
