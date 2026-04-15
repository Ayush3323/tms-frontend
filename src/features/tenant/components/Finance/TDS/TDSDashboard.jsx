import React, { useState } from 'react'
import TDSEntriesPage from './TDSEntriesPage'
import TDSReturnsPage from './TDSReturnsPage'

export default function TDSDashboard() {
  const [activeTab, setActiveTab] = useState('entries')

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-8 py-4">
            <button 
              type="button" 
              onClick={() => setActiveTab('entries')}
              className={`text-xs font-bold transition-all border-b-2 pb-4 -mb-4 uppercase tracking-widest ${activeTab === 'entries' ? 'text-[#0052CC] border-[#0052CC]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              TDS Entries
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('returns')}
              className={`text-xs font-bold transition-all border-b-2 pb-4 -mb-4 uppercase tracking-widest ${activeTab === 'returns' ? 'text-[#0052CC] border-[#0052CC]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Quarterly Returns
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {activeTab === 'entries' ? <TDSEntriesPage /> : <TDSReturnsPage />}
      </div>
    </div>
  )
}
