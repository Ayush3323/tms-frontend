import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';

export default function TripManagerPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] p-8">
      <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Wrench size={20} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Trip Manager is being redesigned</h1>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          The old Trip Manager has been removed to avoid broken workflows and duplicate functionality.
          Use Trips and Trip Detail pages meanwhile.
        </p>
        <button
          type="button"
          onClick={() => navigate('/tenant/dashboard/orders/trips')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4a6cf7] text-white rounded-xl text-sm font-bold hover:bg-[#3b59d9] transition-all"
        >
          Open Trips <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
