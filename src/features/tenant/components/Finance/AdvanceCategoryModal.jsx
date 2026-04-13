import React, { useState } from 'react'
import { XCircle } from 'lucide-react'
import {
  useAdvanceCategories,
  useCreateAdvanceCategory,
  useUpdateAdvanceCategory,
  useDeleteAdvanceCategory,
} from '../../queries/finance/financeQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function AdvanceCategoryModal({ isOpen, onClose }) {
  const [catForm, setCatForm] = useState({ id: null, category_name: '', category_code: '' })
  const { data: catData, refetch } = useAdvanceCategories()
  const categories = asList(catData)
  
  const createCat = useCreateAdvanceCategory()
  const updateCat = useUpdateAdvanceCategory()
  const deleteCat = useDeleteAdvanceCategory()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#172B4D]">Manage Advance Categories</h3>
          <button type="button" onClick={() => { onClose(); setCatForm({ id: null, category_name: '', category_code: '' }) }} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg space-y-2">
          <p className="text-[10px] font-bold text-blue-600 uppercase">
            {catForm.id ? 'Edit Category' : 'Create New Category'}
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-100"
              placeholder="Category Name"
              value={catForm.category_name}
              onChange={(e) => setCatForm({ ...catForm, category_name: e.target.value })}
            />
            <input
              className="w-24 border rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-100 uppercase"
              placeholder="Code"
              value={catForm.category_code}
              onChange={(e) => setCatForm({ ...catForm, category_code: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            {catForm.id && (
              <button type="button" className="text-xs text-gray-500 underline" onClick={() => setCatForm({ id: null, category_name: '', category_code: '' })}>
                Clear
              </button>
            )}
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold disabled:opacity-50"
              disabled={!catForm.category_name || !catForm.category_code || createCat.isPending || updateCat.isPending}
              onClick={() => {
                const data = { category_name: catForm.category_name, category_code: catForm.category_code.toUpperCase() }
                const onSuccess = () => {
                  setCatForm({ id: null, category_name: '', category_code: '' })
                  refetch()
                }
                if (catForm.id) {
                  updateCat.mutate({ id: catForm.id, data }, { onSuccess })
                } else {
                  createCat.mutate(data, { onSuccess })
                }
              }}
            >
              {catForm.id ? 'Save' : 'Create'}
            </button>
          </div>
        </div>

        <div className="max-h-[300px] overflow-auto divide-y divide-gray-100 border rounded-lg">
          {categories.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-400 italic">No categories found.</p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-[#172B4D]">{c.category_name}</p>
                  <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{c.category_code}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCatForm({ id: c.id, category_name: c.category_name, category_code: c.category_code })}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => window.confirm('Delete this category?') && deleteCat.mutate(c.id, { onSuccess: () => refetch() })}
                    className="text-xs text-red-500 hover:underline font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
