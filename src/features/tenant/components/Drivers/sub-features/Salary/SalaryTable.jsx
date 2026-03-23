import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { FREQUENCY_STYLES } from '../../common/constants';
import { formatCurrency, sumObjectValues } from './SalaryModals';
import { getInitials, getAvatarColor } from '../../common/utils';

const SalaryTable = ({ salaries, onEdit, showDriver = false, driverMap = {} }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 text-nowrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {[
              { key: 'base_salary', label: 'Base Salary' },
              { key: 'allowances', label: 'Allowances' },
              { key: 'deductions', label: 'Deductions' },
              { key: 'net_salary', label: 'Net Salary' },
              { key: 'per_trip_rate', label: 'Trip Rate' },
              { key: 'per_km_rate', label: 'KM Rate' },
              { key: 'overtime_rate', label: 'OT Rate' },
              { key: 'payment_frequency', label: 'Frequency' },
              { key: 'effective_from', label: 'Effective From' },
              { key: 'effective_to', label: 'Effective To' },
              { key: 'notes', label: 'Notes' },
              { key: 'actions', label: 'Actions' }
            ].map(h => (
              <th key={h.key} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {salaries.map(sal => {
            const b = parseFloat(sal.base_salary) || 0;
            const a = sumObjectValues(sal.allowances);
            const d = sumObjectValues(sal.deductions);
            const calculatedNet = b + a - d;

            return (
              <tr key={sal.id} className="hover:bg-blue-50/30 transition-colors">
                {showDriver && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne ${getAvatarColor(driverMap[sal.driver]?.name || sal.driver_name || 'System Driver')}`}>
                        {getInitials(driverMap[sal.driver]?.name || sal.driver_name || 'System Driver')}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                          {driverMap[sal.driver]?.name || (sal.driver_details?.user?.first_name ? `${sal.driver_details.user.first_name} ${sal.driver_details.user.last_name || ''}` : (sal.driver_name || 'System Driver'))}
                        </div>
                        <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                          {driverMap[sal.driver]?.employee_id || sal.employee_id || sal.driver_details?.employee_id || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                  {formatCurrency(sal.base_salary)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-green-600 font-semibold">
                  {sal.allowances ? `+${formatCurrency(sal.allowances)}` : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-red-500 font-semibold">
                  {sal.deductions ? `-${formatCurrency(sal.deductions)}` : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-black text-[13px] text-[#0052CC]">
                    {formatCurrency(sal.net_salary || calculatedNet)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                  {formatCurrency(sal.per_trip_rate)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                  {formatCurrency(sal.per_km_rate)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                  {formatCurrency(sal.overtime_rate)}/hr
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge
                    label={sal.payment_frequency_display ?? sal.payment_frequency}
                    styles={FREQUENCY_STYLES[sal.payment_frequency]}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                  {sal.effective_from ?? '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                  {sal.effective_to ?? <span className="text-green-600 font-semibold">Current</span>}
                </td>
                <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={sal.notes}>
                  {sal.notes || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <TableActions 
                    onEdit={() => onEdit(sal)} 
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SalaryTable;
