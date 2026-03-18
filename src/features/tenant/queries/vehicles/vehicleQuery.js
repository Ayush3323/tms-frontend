import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '../../api/vehicles/vehicleEndpoint'
import { toast } from 'react-hot-toast'

// Error parser
const parseError = (error) =>
  error?.response?.data?.detail || 'Something went wrong'


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

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      qc.invalidateQueries({ queryKey: ['vehicle'] })
      toast.success('Vehicle updated successfully')
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