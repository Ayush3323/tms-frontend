import React from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react';

const TableActions = ({ onView, onEdit, onDelete, viewLabel = 'View', editLabel = 'Edit', deleteLabel = 'Delete' }) => {
  return (
    <div className="flex items-center gap-2">
      {onView && (
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:border-blue-200 transition-all shadow-sm"
        >
          <Eye size={11} /> {viewLabel}
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <Pencil size={11} /> {editLabel}
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-all shadow-sm"
        >
          <Trash2 size={11} /> {deleteLabel}
        </button>
      )}
    </div>
  );
};

export default TableActions;
