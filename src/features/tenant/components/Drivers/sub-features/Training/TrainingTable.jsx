import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES } from '../../common/constants';
import { getExpiryColor } from '../../common/utils';

const TrainingTable = ({ records, onEdit, onDelete, showDriver = false, driverMap = {} }) => {
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
            {['Training Type', 'Training Date', 'Expiry Date', 'Status', 'Trainer', 'Cert No.', 'Cert File', 'Notes', 'Actions'].map(h => (
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
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">{rec.training_type_display ?? rec.training_type}</td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{rec.training_date ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] font-mono ${getExpiryColor(rec.expiry_date)}`}>{rec.expiry_date ?? '—'}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={rec.status_display ?? rec.status}
                  styles={STATUS_STYLES[rec.status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{rec.trainer_name ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {rec.certificate_number
                  ? <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{rec.certificate_number}</span>
                  : <span className="text-[12px] text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                {rec.certificate_url ? (
                  <a href={rec.certificate_url} target="_blank" rel="noreferrer" className="text-[#0052CC] hover:underline font-semibold">View File</a>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={rec.notes}>
                {rec.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(rec)}
                  onDelete={() => onDelete(rec)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainingTable;
