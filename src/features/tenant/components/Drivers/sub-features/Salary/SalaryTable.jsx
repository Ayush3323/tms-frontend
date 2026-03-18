import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { FREQUENCY_STYLES } from '../../common/constants';
import { formatCurrency, sumObjectValues } from './SalaryModals';

const SalaryTable = ({ salaries, onEdit, onDelete, showDriver = false, driverMap = {} }) => {
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
            {['Base Salary', 'Allowances', 'Deductions', 'Net Salary', 'Trip Rate', 'KM Rate', 'Overtime', 'Frequency', 'Effective From', 'Effective To', 'Notes', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
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
                  <>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700 text-[12px]">
                      {driverMap[sal.driver]?.name || (sal.driver_details?.user?.first_name ? `${sal.driver_details.user.first_name} ${sal.driver_details.user.last_name || ''}` : (sal.driver_name || 'System Driver'))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                      {driverMap[sal.driver]?.employee_id || sal.employee_id || sal.driver_details?.employee_id || '—'}
                    </td>
                  </>
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
                <td className="px-4 py-3 text-[12px] text-gray-600 max-w-xs truncate" title={sal.notes}>
                  {sal.notes || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <TableActions 
                    onEdit={() => onEdit(sal)} 
                    onDelete={() => onDelete(sal)}
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
