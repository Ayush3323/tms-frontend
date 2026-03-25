import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { SEVERITY_STYLES, INCIDENT_TYPE_STYLES, STATUS_STYLES } from '../../common/constants';
import { getInitials } from '../../common/utils';

const IncidentTable = ({ incidents, onEdit, showDriver = false, driverMap = {}, vehicleMap = {}, userMap = {}, currentUser = null }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const headers = [
    { key: 'incident_type', label: 'Incident Type' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'trip_id', label: 'Trip ID' },
    { key: 'incident_date', label: 'Incident Date' },
    { key: 'location', label: 'Location' },
    { key: 'severity', label: 'Severity' },
    { key: 'description', label: 'Description' },
    { key: 'resolution_status', label: 'Status' },
    { key: 'resolution_notes', label: 'Res. Notes' },
    { key: 'resolved_by', label: 'Resolved By' },
    { key: 'resolved_at', label: 'Resolved At' },
    { key: 'police_report_number', label: 'Police Ref' },
    { key: 'insurance_claim_number', label: 'Insurance Ref' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="w-full min-w-max">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#fafbff] border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {headers.map(h => (
              <th key={h.key} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {incidents.map(inc => (
            <tr key={inc.id} className="hover:bg-blue-50/30 transition-colors text-nowrap">
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne bg-[#0052CC]">
                      {getInitials(driverMap[inc.driver]?.name || inc.driver_name || 'System Driver')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[inc.driver]?.name || inc.driver_name || 'System Driver'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[inc.driver]?.employee_id || inc.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.incident_type_display ?? inc.incident_type}
                  styles={INCIDENT_TYPE_STYLES[inc.incident_type]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#0052CC]">
                <span className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  {vehicleMap[inc.vehicle] || inc.vehicle_registration_number || inc.vehicle || '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-500 font-mono">
                {inc.trip_id || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {formatDate(inc.incident_date)}
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-37.5 truncate whitespace-nowrap">
                {inc.location ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.severity_display ?? inc.severity}
                  styles={SEVERITY_STYLES[inc.severity]}
                />
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={inc.description}>
                {inc.description || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={inc.resolution_status_display ?? inc.resolution_status}
                  styles={STATUS_STYLES[inc.resolution_status]}
                />
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={inc.resolution_notes}>
                {inc.resolution_notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {(() => {
                  const resolvedBy = userMap[inc.resolved_by] || 
                    (inc.resolved_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) || 
                    inc.resolved_by_name || inc.resolved_by || '—';
                  
                  if (resolvedBy === '—') return '—';

                  return (
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm bg-[#0052CC]">
                         {getInitials(resolvedBy)}
                       </div>
                       <span className="text-[12px] font-semibold text-[#1a202c]">{resolvedBy}</span>
                    </div>
                  );
                })()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-800">
                {inc.resolved_at ? formatDate(inc.resolved_at) : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {inc.police_report_number
                  ? <span className="font-mono text-[12px] text-gray-600">{inc.police_report_number}</span>
                  : <span className="text-[12px] text-gray-400">—</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600 font-mono">
                {inc.insurance_claim_number || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(inc)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IncidentTable;
