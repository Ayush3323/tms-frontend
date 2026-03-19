import React, { useState } from 'react';
import { Loader2, Plus, Pencil } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject } from '../../common/utils';
import {
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
} from '../../../../queries/drivers/incidentsAndAttendance';
import { useVehiclesList } from '../../../../queries/drivers/vehicleAssignmentQuery';
import DriverSelect from '../../common/DriverSelect';
import { INCIDENT_TYPES, SEVERITY_TYPES as SEVERITY_LIST, RESOLUTION_STATUS } from '../../common/constants';

// Vehicle Select for incidents - Displays registration, make and model
export const VehicleSelect = ({ value, onChange, ...props }) => {
  const { data, isLoading } = useVehiclesList({ status: 'ACTIVE' });
  const vehicles = data?.results ?? [];

  return (
    <Select value={value} onChange={onChange} disabled={isLoading} {...props}>
      <option value="">{isLoading ? 'Loading vehicles...' : 'Select vehicle'}</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>
          {v.registration_number} — {v.make} {v.model}
        </option>
      ))}
    </Select>
  );
};

export const AddIncidentModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    vehicle: '',
    trip_id: '',
    incident_type: '',
    incident_date: '',
    location: '',
    description: '',
    severity: 'LOW',
    resolution_status: 'OPEN',
    police_report_number: '',
    insurance_claim_number: '',
    resolution_notes: '',
  });
  const [error, setError] = useState('');
  const createIncident = useCreateIncident(targetDriverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!targetDriverId) return setError('Please select a driver.');
    if (!form.incident_type) return setError('Incident type is required.');
    if (!form.incident_date) return setError('Incident date is required.');
    if (!form.location) return setError('Location is required.');
    if (!form.description) return setError('Description is required.');
    if (!form.severity) return setError('Severity is required.');

    createIncident.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to add incident.'),
    });
  };

  return (
    <ModalWrapper
      title="Add Incident"
      description="Record a new incident"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.incident_type || !form.incident_date || createIncident.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createIncident.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Plus size={14} /> Add Incident</>
            }
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}

        {!driverId && (
          <div>
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Incident Type</Label>
            <Select value={form.incident_type} onChange={set('incident_type')}>
              <option value="">Select type</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={(e) => setForm(p => ({ ...p, vehicle: e.target.value }))} />
          </div>
          <div>
            <Label>Trip ID</Label>
            <Input placeholder="Trip UUID" value={form.trip_id} onChange={set('trip_id')} />
          </div>
          <div>
            <Label required>Severity</Label>
            <Select value={form.severity} onChange={set('severity')}>
              {SEVERITY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Incident Date & Time</Label>
            <Input type="datetime-local" value={form.incident_date} onChange={set('incident_date')} />
          </div>
          <div>
            <Label required>Location</Label>
            <Input placeholder="e.g. NH-44, near Agra" value={form.location} onChange={set('location')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Police Report #</Label>
            <Input placeholder="Police report #" value={form.police_report_number} onChange={set('police_report_number')} />
          </div>
          <div>
            <Label>Insurance Claim #</Label>
            <Input placeholder="Claim number" value={form.insurance_claim_number} onChange={set('insurance_claim_number')} />
          </div>
        </div>
        <div>
          <Label required>Description</Label>
          <textarea
            rows={2} placeholder="Describe what happened..."
            value={form.description} onChange={set('description')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none"
          />
        </div>
        <div className="border-t border-gray-100 pt-4 mt-4">
          <Label>Resolution Status</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Select value={form.resolution_status} onChange={set('resolution_status')}>
              {RESOLUTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input placeholder="Resolution notes..." value={form.resolution_notes} onChange={set('resolution_notes')} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditIncidentModal = ({ incident, driverId, onClose }) => {
  const [form, setForm] = useState({
    vehicle: incident.vehicle ?? '',
    trip_id: incident.trip_id ?? '',
    incident_type: incident.incident_type ?? '',
    incident_date: incident.incident_date ? incident.incident_date.slice(0, 16) : '',
    location: incident.location ?? '',
    description: incident.description ?? '',
    severity: incident.severity ?? 'LOW',
    resolution_status: incident.resolution_status ?? 'OPEN',
    police_report_number: incident.police_report_number ?? '',
    insurance_claim_number: incident.insurance_claim_number ?? '',
    resolution_notes: incident.resolution_notes ?? '',
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateIncident = useUpdateIncident(driverId, incident.id);
  const deleteIncident = useDeleteIncident(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    if (!form.incident_type) return setError('Incident type is required.');
    if (!form.incident_date) return setError('Incident date is required.');
    if (!form.location) return setError('Location is required.');
    if (!form.description) return setError('Description is required.');

    updateIncident.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(err.message || 'Failed to update incident.'),
    });
  };

  return (
    <ModalWrapper
      title="Edit Incident"
      description={<span>Editing: <span className="font-semibold text-gray-600">{incident.incident_type_display ?? incident.incident_type}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Incident
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.incident_type || !form.incident_date || updateIncident.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateIncident.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : <><Pencil size={14} /> Update Incident</>
              }
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Incident?"
          description="This incident will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteIncident.mutate(incident.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteIncident.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Incident Type</Label>
            <Select value={form.incident_type} onChange={set('incident_type')}>
              <option value="">Select type</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div><Label>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={(e) => setForm(p => ({ ...p, vehicle: e.target.value }))} />
          </div>
          <div><Label>Trip ID</Label>
            <Input placeholder="Trip UUID" value={form.trip_id} onChange={set('trip_id')} />
          </div>
          <div>
            <Label required>Severity</Label>
            <Select value={form.severity} onChange={set('severity')}>
              {SEVERITY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <Label required>Incident Date & Time</Label>
            <Input type="datetime-local" value={form.incident_date} onChange={set('incident_date')} />
          </div>
          <div>
            <Label required>Location</Label>
            <Input placeholder="e.g. NH-44, near Agra" value={form.location} onChange={set('location')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Police Report #</Label>
            <Input placeholder="Police report #" value={form.police_report_number} onChange={set('police_report_number')} />
          </div>
          <div>
            <Label>Insurance Claim #</Label>
            <Input placeholder="Claim number" value={form.insurance_claim_number} onChange={set('insurance_claim_number')} />
          </div>
        </div>
        <div>
          <Label required>Description</Label>
          <textarea
            rows={2} placeholder="Describe what happened..."
            value={form.description} onChange={set('description')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none"
          />
        </div>
        <div className="border-t border-gray-100 pt-4 mt-4">
          <Label>Resolution Status</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Select value={form.resolution_status} onChange={set('resolution_status')}>
              {RESOLUTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input placeholder="Resolution notes..." value={form.resolution_notes} onChange={set('resolution_notes')} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteIncidentDialog = ({ incident, driverId, onClose }) => {
  const deleteMutation = useDeleteIncident(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(incident.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Incident?"
      description={<p><span className="font-semibold text-gray-600">{incident.incident_type_display || incident.incident_type}</span> incident will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
