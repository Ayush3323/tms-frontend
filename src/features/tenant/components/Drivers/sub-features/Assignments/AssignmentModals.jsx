import React, { useState, useMemo } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateVehicleAssignment,
  useUpdateVehicleAssignment,
  useDeleteVehicleAssignment,
  useDriverVehicleAssignments,
  useVehiclesList,
} from '../../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../../queries/users/userQuery';
import { useCurrentUser } from '../../../../queries/users/userActionQuery';
import DriverSelect from '../../common/DriverSelect';


// Vehicle Select for assignments - Displays registration, make and model
export const VehicleSelect = ({ value, onChange }) => {
  const { data, isLoading } = useVehiclesList({ status: 'ACTIVE' });
  const vehicles = data?.results ?? [];

  return (
    <Select value={value} onChange={onChange} disabled={isLoading}>
      <option value="">{isLoading ? 'Loading vehicles...' : 'Select vehicle'}</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>
          {v.registration_number} — {v.make} {v.model}
        </option>
      ))}
    </Select>
  );
};
import { ASSIGNMENT_TYPES } from '../../common/constants';

export const AddAssignmentModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState({
    vehicle: '',
    assigned_date: '',
    unassigned_date: '',
    assignment_type: 'PERMANENT',
    is_active: true,
    assigned_by: '',
    notes: '',
  });

  // Auto-fill assigned_by when currentUser is loaded
  React.useEffect(() => {
    if (currentUser?.id && !form.assigned_by) {
      setForm(p => ({ ...p, assigned_by: currentUser.id }));
    }
  }, [currentUser, form.assigned_by]);

  const [error, setError] = useState('');
  const { data: assignmentsData } = useDriverVehicleAssignments(targetDriverId);
  const createAssignment = useCreateVehicleAssignment(targetDriverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    const hasActive = assignmentsData?.results?.some(
      (a) => a.is_active === true || a.is_active === 'true' || a.is_active === 1 || a.is_active === '1'
    );
    if (hasActive) return setError('You cannot add more than 1 vehicle to driver at one time.');

    if (!targetDriverId) return setError('Please select a driver.');
    if (!form.vehicle) return setError('Vehicle is required.');
    if (!form.assigned_date) return setError('Assigned date is required.');

    if (form.unassigned_date && form.unassigned_date < form.assigned_date) {
      return setError('Unassigned date cannot be before assigned date.');
    }

    createAssignment.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Assign Vehicle"
      description="Assign a vehicle to a driver"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.vehicle || !form.assigned_date || createAssignment.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createAssignment.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Assign Vehicle</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        
        {!driverId && (
          <div>
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} disableBusy={true} />
          </div>
        )}

        <div>
          <Label required>vehicle</Label>
          <VehicleSelect value={form.vehicle} onChange={set('vehicle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label required>assigned_date</Label><Input type="date" value={form.assigned_date} onChange={set('assigned_date')} /></div>
          <div><Label>unassigned_date</Label><Input type="date" value={form.unassigned_date} onChange={set('unassigned_date')} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>assignment_type</Label>
            <Select value={form.assignment_type} onChange={set('assignment_type')}>
              {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="is_active_add" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#0052CC] cursor-pointer" />
            <label htmlFor="is_active_add" className="text-sm font-semibold text-gray-600 cursor-pointer">is_active</label>
          </div>
          <div><Label>assigned_by</Label>
            <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium">
              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
            </div>
          </div>
        </div>
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditAssignmentModal = ({ assignment, driverId, onClose }) => {
  const [form, setForm] = useState({
    vehicle: assignment.vehicle ?? '',
    assigned_date: assignment.assigned_date ?? '',
    unassigned_date: assignment.unassigned_date ?? '',
    assignment_type: assignment.assignment_type ?? 'PERMANENT',
    is_active: assignment.is_active ?? true,
    assigned_by: assignment.assigned_by ?? '',
    notes: assignment.notes ?? '',
  });
  const { data: usersData } = useUsers({ page_size: 1000 });
  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const { data: assignmentsData } = useDriverVehicleAssignments(driverId);
  const updateAssignment = useUpdateVehicleAssignment(driverId, assignment.id);
  const deleteAssignment = useDeleteVehicleAssignment(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    
    // Check if trying to activate this one while another is already active
    if (form.is_active) {
      const otherActive = assignmentsData?.results?.some(
        (a) =>
          (a.is_active === true || a.is_active === 'true' || a.is_active === 1 || a.is_active === '1') &&
          a.id !== assignment.id
      );
      if (otherActive) return setError('Another vehicle is already active for this driver. Please deactivate it first.');
    }

    if (!form.vehicle) return setError('Vehicle is required.');
    if (!form.assigned_date) return setError('Assigned date is required.');

    if (form.unassigned_date && form.unassigned_date < form.assigned_date) {
      return setError('Unassigned date cannot be before assigned date.');
    }

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (k === 'is_active' || k === 'assigned_by') return [k, v];
        return [k, v === '' ? null : v];
      })
    );
    updateAssignment.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Assignment"
      description={<span>Editing: <span className="font-semibold text-gray-600">{assignment.vehicle_registration ?? 'Vehicle'}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Assignment
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!form.vehicle || !form.assigned_date || updateAssignment.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateAssignment.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Pencil size={14} /> Update Assignment</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Assignment?"
          description="This assignment will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteAssignment.mutate(assignment.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteAssignment.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div>
          <Label required>vehicle</Label>
          <VehicleSelect value={form.vehicle} onChange={set('vehicle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label required>assigned_date</Label><Input type="date" value={form.assigned_date} onChange={set('assigned_date')} /></div>
          <div><Label>unassigned_date</Label><Input type="date" value={form.unassigned_date} onChange={set('unassigned_date')} /></div>
          <div><Label>assignment_type</Label>
            <Select value={form.assignment_type} onChange={set('assignment_type')}>
              {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="is_active_edit" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#0052CC] cursor-pointer" />
            <label htmlFor="is_active_edit" className="text-sm font-semibold text-gray-600 cursor-pointer">is_active</label>
          </div>
          <div><Label>assigned_by</Label>
            <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium">
              {userMap[form.assigned_by] || form.assigned_by || '—'}
            </div>
          </div>
        </div>
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteAssignmentDialog = ({ assignment, driverId, onClose }) => {
  const deleteMutation = useDeleteVehicleAssignment(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(assignment.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Assignment?"
      description={<p>Vehicle <span className="font-semibold text-gray-600">{assignment.vehicle_registration ?? 'assignment'}</span> will be permanently removed.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
