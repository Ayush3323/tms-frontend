import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast' // Or your preferred notification library
import { 
  customersApi, 
  consignorsApi, 
  consigneesApi, 
  brokersApi 
} from '../../api/customers/customersEndpoint'

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (params) => [...customerKeys.lists(), { params }],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
  
  consignors: () => ['consignors'],
  consignees: () => ['consignees'],
  brokers: () => ['brokers'],
}

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
const handleApiError = (error, customMessage) => {
  const message = error.response?.data?.message || error.message || customMessage
  toast.error(message)
  console.error(`API Error [${customMessage}]:`, error)
}

// ─── 1. CUSTOMER HOOKS ───────────────────────────────────────────────────────

export const useCustomers = (params) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch customers'),
  })
}

export const useCustomer = (id) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch customer details'),
  })
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      toast.success('Customer created successfully')
    },
    onError: (err) => handleApiError(err, 'Could not create customer'),
  })
}





export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
      toast.success('Customer updated')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

// ─── 2. CONSIGNOR HOOKS ──────────────────────────────────────────────────────

export const useConsignors = (params) => {
  return useQuery({
    queryKey: [customerKeys.consignors(), params],
    queryFn: () => consignorsApi.list(params),
  })
}

export const useCreateConsignee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => consigneesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.consignees() })
      toast.success('Consignee profile created')
    },
    onError: (err) => handleApiError(err, 'Failed to create consignee'),
  })
}

// ─── 3. BROKER HOOKS ─────────────────────────────────────────────────────────

export const useBroker = (customerId) => {
  return useQuery({
    queryKey: [customerKeys.brokers(), customerId],
    queryFn: () => brokersApi.get(customerId),
    enabled: !!customerId,
    onError: (err) => handleApiError(err, 'Broker profile not found'),
  })
}