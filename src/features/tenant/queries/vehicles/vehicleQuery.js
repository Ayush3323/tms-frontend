import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi } from '../api/vehicleEndpoints'
import { toast } from 'react-hot-toast'

// Error parser
const parseError = (error) =>
  error?.response?.data?.detail || 'Something went wrong'


// ─────────────── GET ALL VEHICLES ───────────────

export const useVehicles = (params) =>
  useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehiclesApi.list(params),

    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── GET SINGLE VEHICLE ───────────────

export const useVehicle = (id) =>
  useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.get(id),
    enabled: !!id,

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

export const useVehicleDocuments = (id) =>
  useQuery({
    queryKey: ['vehicleDocuments', id],
    queryFn: () => vehiclesApi.getDocuments(id),
    enabled: !!id,

    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── VEHICLE MAINTENANCE ───────────────

export const useVehicleMaintenance = (id) =>
  useQuery({
    queryKey: ['vehicleMaintenance', id],
    queryFn: () => vehiclesApi.getMaintenance(id),
    enabled: !!id,

    onError: (error) => toast.error(parseError(error))
  })


// ─────────────── VEHICLE FUEL LOGS ───────────────

export const useVehicleFuelLogs = (id) =>
  useQuery({
    queryKey: ['vehicleFuelLogs', id],
    queryFn: () => vehiclesApi.getFuelLogs(id),
    enabled: !!id,

    onError: (error) => toast.error(parseError(error))
  })