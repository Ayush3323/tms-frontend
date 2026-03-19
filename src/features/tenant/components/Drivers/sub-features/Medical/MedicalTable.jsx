import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES } from '../../common/constants';
import { getExpiryColor } from '../../common/utils';

const MedicalTable = ({ records, onEdit, showDriver = false, driverMap = {} }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Driver Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Emp ID</th>
              </>
            )}
            {['Exam Date', 'Next Due', 'Fitness', 'Blood Group', 'Doctor', 'Cert No.', 'Cert File', 'Restrictions', 'Notes', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map(rec => (
            <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                    {driverMap[rec.driver]?.name || rec.driver_name || 'System Driver'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                    {driverMap[rec.driver]?.employee_id || rec.employee_id || '—'}
                  </td>
                </>
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
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={rec.restrictions}>
                {rec.restrictions || '—'}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={rec.notes}>
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
