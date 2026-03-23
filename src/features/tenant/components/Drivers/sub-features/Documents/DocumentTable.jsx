import React from 'react';
import StatusBadge from '../../common/StatusBadge';
import TableActions from '../../common/TableActions';
import { STATUS_STYLES as VERIFICATION_STYLES } from '../../common/constants';
import { getExpiryColor, getInitials, getAvatarColor } from '../../common/utils';

const DocumentTable = ({ documents, onEdit, showDriver = false, driverMap = {}, userMap = {}, currentUser = null }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {showDriver && (
              <th className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">Driver</th>
            )}
            {[
              'Document Type', 'Document Number', 'Issue Date', 'Expiry Date', 
              'Issuing Authority', 'Verification', 'Verified By', 'Verified At', 
              'File URL', 'Notes', 'Actions'
            ].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em] whitespace-nowrap bg-[#fafbff] shadow-[inset_0_-1px_0_#e2e8f0]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {documents.map(doc => (
            <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
              {showDriver && (
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-xs text-white shadow-sm font-syne ${getAvatarColor(driverMap[doc.driver]?.name || doc.driver_name || 'System Driver')}`}>
                      {getInitials(driverMap[doc.driver]?.name || doc.driver_name || 'System Driver')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1a202c] text-[13px] line-height-1">
                        {driverMap[doc.driver]?.name || doc.driver_name || 'System Driver'}
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">
                        {driverMap[doc.driver]?.employee_id || doc.employee_id || '—'}
                      </div>
                    </div>
                  </div>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap font-semibold text-[#172B4D] text-[13px]">
                {doc.document_type_display ?? doc.document_type}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {doc.document_number ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issue_date ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[12px] font-mono ${getExpiryColor(doc.expiry_date)}`}>
                  {doc.expiry_date ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">{doc.issuing_authority ?? '—'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge
                  label={doc.verification_status_display ?? doc.verification_status}
                  styles={VERIFICATION_STYLES[doc.verification_status]}
                />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {doc.verification_status === 'VERIFIED' ? (() => {
                  const verifier = userMap[doc.verified_by]?.name || 
                    (doc.verified_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) ||
                    doc.verified_by || '—';
                  
                  if (verifier === '—') return '—';

                  return (
                    <div className="flex items-center gap-2">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${getAvatarColor(verifier)}`}>
                         {getInitials(verifier)}
                       </div>
                       <span className="text-[12px] font-semibold text-[#1a202c]">{verifier}</span>
                    </div>
                  );
                })() : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                {doc.verification_status === 'VERIFIED' && doc.verified_at ? new Date(doc.verified_at).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                {doc.file_url 
                  ? <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[#0052CC] hover:underline flex items-center gap-1">View File</a>
                  : <span className="text-gray-400">—</span>
                }
              </td>
              <td className="px-4 py-3 text-[12px] text-gray-800 max-w-xs truncate" title={doc.notes}>
                {doc.notes || '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TableActions
                  onEdit={() => onEdit(doc)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable;
