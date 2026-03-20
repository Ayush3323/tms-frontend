import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject } from '../../common/utils';
import {
  useCreatePerformanceMetric,
  useUpdatePerformanceMetric,
  useDeletePerformanceMetric,
} from '../../../../queries/drivers/performanceMetricsQuery';
import DriverSelect from '../../common/DriverSelect';

// Shared Form Fields for Performance
const PerformanceFormFields = ({ form, setForm, error }) => {
    const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
    return (
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><Label required>period_start</Label><Input type="date" value={form.period_start} onChange={set('period_start')} /></div>
          <div><Label required>period_end</Label><Input type="date" value={form.period_end} onChange={set('period_end')} /></div>
          <div><Label>trips_completed</Label><Input type="number" placeholder="e.g. 45" min="0" value={form.trips_completed} onChange={set('trips_completed')} /></div>
          <div><Label>distance_covered</Label><Input type="number" placeholder="e.g. 12500" min="0" step="0.01" value={form.distance_covered} onChange={set('distance_covered')} /></div>
          <div><Label>fuel_efficiency</Label><Input type="number" placeholder="e.g. 8.5" min="0" step="0.1" value={form.fuel_efficiency} onChange={set('fuel_efficiency')} /></div>
          <div><Label>on_time_delivery_rate</Label><Input type="number" placeholder="e.g. 95.5" min="0" max="100" step="0.1" value={form.on_time_delivery_rate} onChange={set('on_time_delivery_rate')} /></div>
          <div><Label>safety_score</Label><Input type="number" placeholder="e.g. 92.5" min="0" max="100" step="0.1" value={form.safety_score} onChange={set('safety_score')} /></div>
          <div><Label>customer_rating</Label><Input type="number" placeholder="e.g. 4.5" min="0" max="5" step="0.1" value={form.customer_rating} onChange={set('customer_rating')} /></div>
        </div>
        <div><Label>notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    );
};

export const AddPerformanceModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    period_start: '',
    period_end: '',
    trips_completed: '',
    distance_covered: '',
    fuel_efficiency: '',
    on_time_delivery_rate: '',
    safety_score: '',
    customer_rating: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const createMetric = useCreatePerformanceMetric(targetDriverId);

  const validate = () => {
    if (!targetDriverId) return 'Please select a driver.';
    if (!form.period_start) return 'Period start date is required.';
    if (!form.period_end) return 'Period end date is required.';
    if (form.period_start > form.period_end) return 'Period end cannot be before start date.';
    
    if (form.trips_completed !== '' && Number(form.trips_completed) < 0) return 'trips_completed cannot be negative.';
    if (form.distance_covered !== '' && Number(form.distance_covered) < 0) return 'distance_covered cannot be negative.';
    if (form.fuel_efficiency !== '' && Number(form.fuel_efficiency) < 0) return 'fuel_efficiency cannot be negative.';
    
    if (form.on_time_delivery_rate !== '') {
      const deliveryRate = Number(form.on_time_delivery_rate);
      if (deliveryRate < 0 || deliveryRate > 100) return 'on_time_delivery_rate must be between 0 and 100.';
    }
    
    if (form.safety_score !== '') {
      const safety = Number(form.safety_score);
      if (safety < 0 || safety > 100) return 'safety_score must be between 0 and 100.';
    }
    
    if (form.customer_rating !== '') {
      const rating = Number(form.customer_rating);
      if (rating < 0 || rating > 5) return 'customer_rating must be between 0 and 5.';
    }
    
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    createMetric.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add performance metric.'),
    });
  };

  return (
    <ModalWrapper
      title="Add Performance Metric"
      description="Add performance data"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.period_start || !form.period_end || createMetric.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createMetric.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Metric</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!driverId && (
            <div>
              <Label required>Driver</Label>
              <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
            </div>
        )}
        <PerformanceFormFields form={form} setForm={setForm} error={error} />
      </div>
    </ModalWrapper>
  );
};

export const EditPerformanceModal = ({ metric, driverId, onClose }) => {
  const [form, setForm] = useState({
    period_start: metric.period_start ?? '',
    period_end: metric.period_end ?? '',
    trips_completed: metric.trips_completed ?? '',
    distance_covered: metric.distance_covered ?? '',
    fuel_efficiency: metric.fuel_efficiency ?? '',
    on_time_delivery_rate: metric.on_time_delivery_rate ?? '',
    safety_score: metric.safety_score ?? '',
    customer_rating: metric.customer_rating ?? '',
    notes: metric.notes ?? '',
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateMetric = useUpdatePerformanceMetric(driverId, metric.id);
  const deleteMetric = useDeletePerformanceMetric(driverId);

  const validate = () => {
    if (!form.period_start) return 'Period start date is required.';
    if (!form.period_end) return 'Period end date is required.';
    if (form.period_start > form.period_end) return 'Period end cannot be before start date.';
    
    if (form.trips_completed !== '' && Number(form.trips_completed) < 0) return 'trips_completed cannot be negative.';
    if (form.distance_covered !== '' && Number(form.distance_covered) < 0) return 'distance_covered cannot be negative.';
    if (form.fuel_efficiency !== '' && Number(form.fuel_efficiency) < 0) return 'fuel_efficiency cannot be negative.';
    
    if (form.on_time_delivery_rate !== '') {
      const deliveryRate = Number(form.on_time_delivery_rate);
      if (deliveryRate < 0 || deliveryRate > 100) return 'on_time_delivery_rate must be between 0 and 100.';
    }
    
    if (form.safety_score !== '') {
      const safety = Number(form.safety_score);
      if (safety < 0 || safety > 100) return 'safety_score must be between 0 and 100.';
    }
    
    if (form.customer_rating !== '') {
      const rating = Number(form.customer_rating);
      if (rating < 0 || rating > 5) return 'customer_rating must be between 0 and 5.';
    }
    
    return null;
  };

  const handleSubmit = () => {
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    updateMetric.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update performance metric.'),
    });
  };

  return (
    <ModalWrapper
      title="Edit Performance Metric"
      description={<span>Editing: <span className="font-semibold text-gray-600">{metric.period_start} → {metric.period_end}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Metric
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.period_start || !form.period_end || updateMetric.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateMetric.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Metric</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Performance Metric?"
          description="This performance metric will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteMetric.mutate(metric.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteMetric.isPending}
        />
      )}
      <PerformanceFormFields form={form} setForm={setForm} error={error} />
    </ModalWrapper>
  );
};

export const DeletePerformanceDialog = ({ metric, driverId, onClose }) => {
  const deleteMutation = useDeletePerformanceMetric(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(metric.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Performance Metric?"
      description={<p>Period <span className="font-semibold text-gray-600">{metric.period_start} → {metric.period_end}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
