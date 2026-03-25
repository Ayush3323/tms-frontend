import React from 'react';
import { Phone, Pencil, Plus } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';

import { getInitials } from '../../common/utils';

const ContactTable = ({ contacts, onEdit, showDriver = false, driverMap = {} }) => {

  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['Contact Name', 'Relationship', 'Phone', 'Alternate Phone', 'Address', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {contacts.map(c => {
            const driverName = driverMap[c.driver]?.name || c.driver_name || 'System Driver';
            const empId = driverMap[c.driver]?.employee_id || c.employee_id || '—';
            
            return (
              <tr key={c.id} className="hover:bg-[#f7f9ff] transition-colors group">
                {showDriver && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                        {getInitials(driverName)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                          {driverName}
                        </div>
                        <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                          {empId}
                        </div>
                      </div>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                    {c.contact_name}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-semibold text-[13px] text-[#1a202c]">
                    {c.relationship ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[12px] text-[#3b7ef8] bg-[#3b7ef8]/5 px-3 py-1 rounded-[20px] border border-[#3b7ef8]/15 w-fit">
                    <Phone size={10} /> {c.phone ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {c.alternate_phone ? (
                    <span className="font-medium text-[12px] text-[#64748b] flex items-center gap-1.5">
                      <Phone size={10} /> {c.alternate_phone}
                    </span>
                  ) : <span className="text-[11px] text-[#64748b] italic">Not provided</span>}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#64748b] min-w-[200px] whitespace-normal line-clamp-2" title={c.address}>
                  {c.address ? c.address : <span className="text-[11px] text-[#64748b] italic">Not provided</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {c.is_primary ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#16a34a]/10 border border-[#16a34a]/20 rounded-[20px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shadow-[0_0_5px_rgba(22,163,74,0.5)] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#16a34a] uppercase tracking-tight">PRIMARY</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#64748b]/10 border border-[#e2e8f0] rounded-[20px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                      <span className="text-[11px] font-semibold text-[#64748b]">Secondary</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#3b7ef8] hover:bg-[#3b7ef8]/10 border border-[#e2e8f0] hover:border-[#3b7ef8] rounded-[7px] transition-all"
                    >
                      <Pencil size={12} className="text-[#FFAB00]" />
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ContactTable;
