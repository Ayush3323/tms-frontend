import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleTypesApi } from '../../api/vehicles/vehicleEndpoint'
import { toast } from 'react-hot-toast'

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

// LIST
export const useVehicleTypes = (params, options = {}) =>
  useQuery({
    queryKey: ['vehicleTypes', params],
    queryFn: () => vehicleTypesApi.list(params),
    ...options,
    onError: (error) => toast.error(parseError(error))
  })

// GET SINGLE
export const useVehicleType = (id, options = {}) =>
  useQuery({
    queryKey: ['vehicleTypes', id],
    queryFn: () => vehicleTypesApi.get(id),
    ...options,
    enabled: (options.enabled !== undefined ? options.enabled : true) && !!id,
    onError: (error) => toast.error(parseError(error))
  })

// CREATE
export const useCreateVehicleType = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data) => vehicleTypesApi.create(data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTypes'] })
      toast.success('Vehicle type created')
    },

    onError: (error) => toast.error(parseError(error))
  })
}

// UPDATE
export const useUpdateVehicleType = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => vehicleTypesApi.update(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTypes'] })
      toast.success('Vehicle type updated')
    },

    onError: (error) => toast.error(parseError(error))
  })
}

// DELETE
export const useDeleteVehicleType = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id) => vehicleTypesApi.delete(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTypes'] })
      toast.success('Vehicle type deleted')
    },

    onError: (error) => toast.error(parseError(error))
  })
}