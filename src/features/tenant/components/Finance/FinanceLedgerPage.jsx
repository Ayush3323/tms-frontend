import React, { useMemo, useState } from 'react'

import FinanceListPage from './FinanceListPage'
import { useJournalEntries, useLedgerAccounts } from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function FinanceLedgerPage() {
  const [tab, setTab] = useState('accounts')
  const [search, setSearch] = useState('')
  const accParams = useMemo(() => (search ? { search } : {}), [search])
  const jeParams = useMemo(() => (search ? { search } : {}), [search])
  const { data: accData, isLoading: accLoading, refetch: refAcc } = useLedgerAccounts(accParams)
  const { data: jeData, isLoading: jeLoading, refetch: refJe } = useJournalEntries(jeParams)
  const accounts = asList(accData)
  const journals = asList(jeData)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#172B4D]">Ledger</h1>
            <p className="text-gray-500 text-sm mt-1">Chart of accounts and posted journal entries (read-only).</p>
          </div>
          <div className="flex flex-wrap gap-2 p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
            <button
              type="button"
              onClick={() => setTab('accounts')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'accounts' ? 'bg-[#0052CC] text-white shadow-sm' : 'text-[#172B4D] hover:bg-gray-50'}`}
            >
              Chart of Accounts
            </button>
            <button
              type="button"
              onClick={() => setTab('journals')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'journals' ? 'bg-[#0052CC] text-white shadow-sm' : 'text-[#172B4D] hover:bg-gray-50'}`}
            >
              Journal Entries
            </button>
          </div>
        </div>
        {tab === 'accounts' && (
          <FinanceListPage
            embedded
            title="Chart of Accounts"
            subtitle="Read-only ledger accounts (double-entry)."
            search={search}
            setSearch={setSearch}
            onRefresh={refAcc}
            isLoading={accLoading}
            stats={[]}
            rows={accounts}
            columns={[
              { key: 'code', title: 'Code' },
              { key: 'name', title: 'Name' },
              { key: 'account_type', title: 'Type' },
              { key: 'is_active', title: 'Active' },
            ]}
          />
        )}
        {tab === 'journals' && (
          <FinanceListPage
            embedded
            title="Journal Entries"
            subtitle="Posted journals (read-only)."
            search={search}
            setSearch={setSearch}
            onRefresh={refJe}
            isLoading={jeLoading}
            stats={[]}
            rows={journals}
            columns={[
              { key: 'entry_date', title: 'Date' },
              { key: 'reference_type', title: 'Ref Type' },
              { key: 'trip_id', title: 'Trip' },
              { key: 'memo', title: 'Memo' },
            ]}
          />
        )}
      </div>
    </div>
  )
}
