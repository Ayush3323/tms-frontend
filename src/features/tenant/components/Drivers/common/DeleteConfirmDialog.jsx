import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';

const DeleteConfirmDialog = ({
  title,
  description,
  onConfirm,
  onCancel,
  isDeleting,
  confirmText = 'Delete',
  deletingText = 'Deleting...',
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-black text-[#172B4D] mb-1">{title}</h3>
      <div className="text-sm text-gray-400 mb-5">{description}</div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? (
            <>
              <Loader2 size={13} className="animate-spin" /> {deletingText}
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmDialog;
