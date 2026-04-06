import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES } from '../../common/constants';
import { getExpiryColor, getInitials } from '../../common/utils';
import { Edit, GraduationCap, Phone, AlertCircle } from 'lucide-react';

const TrainingTable = ({ records, onEdit, onView, showDriver = false, driverMap = {} }) => {
  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {['Training Type', 'Training Date', 'Expiry Date', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map(rec => (
            <tr 
              key={rec.id} 
              onClick={() => onView && onView(rec)}
              className="hover:bg-[#f7f9ff] transition-colors group cursor-pointer"
            >
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[rec.driver]?.name || rec.driver_name || '-')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[rec.driver]?.name || rec.driver_name || '-'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[rec.driver]?.employee_id || rec.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px] hover:text-[#0052CC] transition-colors">
                {rec.training_type_display ?? rec.training_type}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {rec.training_date ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono text-gray-600 font-medium">
                    {rec.expiry_date ?? '—'}
                  </span>
                  {rec.expiry_date && (
                    <div className="relative group/tooltip">
                      {new Date(rec.expiry_date) < new Date() ? (
                        <AlertCircle size={14} className="text-red-500" />
                      ) : (new Date(rec.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30 ? (
                        <AlertCircle size={14} className="text-red-500 animate-pulse" />
                      ) : null}

                      {((new Date(rec.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30) && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                          <div className="bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-gray-700 font-sans">
                            {new Date(rec.expiry_date) < new Date() 
                              ? `Expired ${Math.abs(Math.ceil((new Date(rec.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)))} days ago!` 
                              : `Expiring in ${Math.ceil((new Date(rec.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} days!`}
                          </div>
                          <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={rec.status_display ?? rec.status}
                  styles={STATUS_STYLES[rec.status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <TableActions 
                  onEdit={() => onEdit(rec)}
                  editLabel="Edit Record"
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
