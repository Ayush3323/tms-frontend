import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleTypesApi } from '../api/vehicleEndpoints'
import { toast } from 'react-hot-toast'

const parseError = (error) =>
  error?.response?.data?.detail || 'Something went wrong'

// LIST
export const useVehicleTypes = (params) =>
  useQuery({
    queryKey: ['vehicleTypes', params],
    queryFn: () => vehicleTypesApi.list(params),

    onError: (error) => toast.error(parseError(error))
  })

// GET SINGLE
export const useVehicleType = (id) =>
  useQuery({
    queryKey: ['vehicleTypes', id],
    queryFn: () => vehicleTypesApi.get(id),
    enabled: !!id,

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