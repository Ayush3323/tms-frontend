import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import AccountStatement from './AccountStatement'
import JournalEntryForm from './JournalEntryForm'
import JournalEntryDetailsModal from './JournalEntryDetailsModal'
import { useJournalEntries, useLedgerAccounts } from '../../../queries/finance/financeQuery'

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
  const [isJournalFormOpen, setIsJournalFormOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [selectedJournalId, setSelectedJournalId] = useState(null)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 relative">
      <JournalEntryForm isOpen={isJournalFormOpen} onClose={() => setIsJournalFormOpen(false)} accounts={accounts} />
      <JournalEntryDetailsModal journalId={selectedJournalId} onClose={() => setSelectedJournalId(null)} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {selectedAccount ? (
          <AccountStatement account={selectedAccount} onBack={() => setSelectedAccount(null)} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-[#172B4D]">Ledger</h1>
                <p className="text-gray-500 text-sm mt-1">Manage Chart of Accounts and Journal Vouchers</p>
              </div>
              <div className="flex items-center gap-4">
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
              <button 
                onClick={() => setIsJournalFormOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#0052CC] hover:bg-blue-700 shadow-sm transition-all shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                <Plus size={16} /> New Entry
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
              onRowClick={(row) => setSelectedAccount(row)}
              columns={[
                { key: 'code', title: 'Code', render: (val, row) => <span className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-700 text-xs border border-gray-200">{val}</span> },
                { key: 'name', title: 'Account Name', render: (val) => <span className="font-bold text-blue-700 cursor-pointer hover:underline">{val}</span> },
                { key: 'account_type', title: 'Type', render: (val) => <span className="text-xs uppercase font-bold tracking-wider text-gray-500">{val}</span> },
                { key: 'is_active', title: 'Status', render: (val) => <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{val ? 'Active' : 'Inactive'}</span> },
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
              { key: 'view', title: '', render: (_, row) => <span onClick={(e) => { e.stopPropagation(); setSelectedJournalId(row.id); }} className="text-blue-600 font-bold text-xs hover:underline cursor-pointer px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">View Details</span> }
            ]}
          />
        )}
        </>
        )}
      </div>
    </div>
  )
}
