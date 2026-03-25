import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES } from '../../common/constants';
import { getExpiryColor, getInitials } from '../../common/utils';

const MedicalTable = ({ records, onEdit, showDriver = false, driverMap = {} }) => {
  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['Examination Date', 'Next Due Date', 'Fitness Status', 'Blood Group', 'Examining Doctor', 'Certificate Number', 'Certificate File', 'Restrictions', 'Notes', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map(rec => (
            <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[rec.driver]?.name || rec.driver_name || 'System Driver')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[rec.driver]?.name || rec.driver_name || 'System Driver'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[rec.driver]?.employee_id || rec.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                {rec.examination_date ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] font-mono ${getExpiryColor(rec.next_due_date)}`}>{rec.next_due_date ?? '—'}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={rec.fitness_status_display ?? rec.fitness_status}
                  styles={STATUS_STYLES[rec.fitness_status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {rec.blood_group
                  ? <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{rec.blood_group}</span>
                  : <span className="text-[12px] text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {rec.examining_doctor ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {rec.certificate_number ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                {rec.certificate_url ? (
                  <a href={rec.certificate_url} target="_blank" rel="noreferrer" className="text-[#0052CC] hover:underline font-semibold">View File</a>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={rec.restrictions}>
                {rec.restrictions || '—'}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={rec.notes}>
                {rec.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(rec)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MedicalTable;
