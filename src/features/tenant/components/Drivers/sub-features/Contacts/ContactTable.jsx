import React from 'react';
import { Phone } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';

const ContactTable = ({ contacts, onEdit, onDelete, showDriver = false, driverMap = {} }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 text-nowrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Driver Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Emp ID</th>
              </>
            )}
            {['Contact Name', 'Relationship', 'Phone', 'Alternate Phone', 'Address', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {contacts.map(c => (
            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[c.driver]?.name || c.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[c.driver]?.employee_id || c.employee_id || '—'}
                  </td>
                </>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">{c.contact_name}</td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{c.relationship ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="flex items-center gap-1.5 font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 w-fit">
                  <Phone size={10} /> {c.phone ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">{c.alternate_phone ?? '—'}</td>
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-45 truncate">{c.address ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {c.is_primary ? (
                  <StatusBadge label="Primary" styles={{ text: 'text-blue-700', bg: 'bg-blue-50 border border-blue-100' }} />
                ) : (
                  <span className="text-xs text-gray-400 pl-2">Secondary</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactTable;
