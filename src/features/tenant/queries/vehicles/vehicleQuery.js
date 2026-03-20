import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '../../api/vehicles/vehicleEndpoint'
import { toast } from 'react-hot-toast'

// Error parser
const parseError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // 1. Friendly status fallbacks
  if (status === 403) return "Access Denied: You don't have permission for this action.";
  if (status === 404) return "Not Found: The requested data doesn't exist.";
  if (status >= 500) return "Server Error: Something went wrong on our end. Please try again.";
  if (!error.response && error.message === 'Network Error') return "Network Error: Please check your connection.";

  // 2. No data fallback
  if (!data) return "An unexpected error occurred.";
  
  // 3. Simple string extraction
  if (typeof data === 'string') {
    if (data.includes('<html')) return `Server Error (${status || 'Unknown'})`;
    return data;
  }
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  
  // 4. Object unpacking (DRF Validation)
  if (typeof data === 'object') {
     const errs = [];
     for (const key in data) {
         const messages = Array.isArray(data[key]) ? data[key] : [data[key]];
         messages.forEach(msg => {
             if (typeof msg !== 'string') return;
             if (key === 'non_field_errors' || key === '__all__') {
                 errs.push(msg);
             } else {
                 const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                 errs.push(`${cleanKey}: ${msg}`);
             }
         });
     }
     if (errs.length > 0) return errs.join(' • '); // Bullet point separation for better single-line toast readability
  }
  
  return "An unexpected error occurred.";
};


// ─────────────── GET ALL VEHICLES ───────────────

export const useVehicles = (params, options = {}) =>
  useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehiclesApi.list(params),
    ...options,
    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── GET SINGLE VEHICLE ───────────────

export const useVehicle = (id, options = {}) =>
  useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.get(id),
    ...options,
    enabled: (options.enabled !== undefined ? options.enabled : true) && !!id,
    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── CREATE VEHICLE ───────────────

export const useCreateVehicle = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data) => vehiclesApi.create(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Vehicle created successfully')
    },

    onError: (error) => toast.error(parseError(error))
  })
}


// ─────────────── UPDATE VEHICLE ───────────────

export const useUpdateVehicle = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => vehiclesApi.update(id, data),

    onSuccess: (responseData, variables) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      qc.invalidateQueries({ queryKey: ['vehicle'] })
      
      const isStatusOnly = Object.keys(variables.data).length === 1 && variables.data.status;
      if (isStatusOnly) {
         const statuses = {
             MAINTENANCE: 'suspended',
             ACTIVE: 'activated',
             RETIRED: 'retired',
             SOLD: 'sold',
             SCRAPPED: 'scrapped'
         };
         const action = statuses[variables.data.status] || 'updated';
         const reg = responseData.registration_number || responseData.registration || '';
         toast.success(`Vehicle ${reg} ${action}`.trim().replace(/\s+/g, ' '));
      } else {
         toast.success('Vehicle updated successfully')
      }
    },

    onError: (error) => toast.error(parseError(error))
  })
}


// ─────────────── DELETE VEHICLE ───────────────

export const useDeleteVehicle = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id) => vehiclesApi.delete(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Vehicle deleted successfully')
    },

    onError: (error) => toast.error(parseError(error))
  })
}


// ─────────────── VEHICLE DOCUMENTS ───────────────

export const useVehicleDocuments = (id, options = {}) =>
  useQuery({
    queryKey: ['vehicleDocuments', id],
    queryFn: () => vehiclesApi.getDocuments(id),
    ...options,
    enabled: (options.enabled !== undefined ? options.enabled : true) && !!id,
    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── VEHICLE MAINTENANCE ───────────────

export const useVehicleMaintenance = (id, options = {}) =>
  useQuery({
    queryKey: ['vehicleMaintenance', id],
    queryFn: () => vehiclesApi.getMaintenance(id),
    ...options,
    enabled: (options.enabled !== undefined ? options.enabled : true) && !!id,
    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── VEHICLE FUEL LOGS ───────────────

export const useVehicleFuelLogs = (id, options = {}) =>
  useQuery({
    queryKey: ['vehicleFuelLogs', id],
    queryFn: () => vehiclesApi.getFuelLogs(id),
    ...options,
    enabled: (options.enabled !== undefined ? options.enabled : true) && !!id,
    onError: (error) => toast.error(parseError(error))
  })