import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  ordersApi, 
  tripsApi, 
  cargoApi, 
  deliveriesApi,
  orderServiceHealthApi 
} from '../../api/orders/ordersEndpoint'

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const orderKeys = {
  all: ['orders'],
  lists: () => [...orderKeys.all, 'list'],
  list: (params) => [...orderKeys.lists(), { params }],
  details: () => [...orderKeys.all, 'detail'],
  detail: (id) => [...orderKeys.details(), id],

  trips: () => ['trips'],
  tripList: (params) => [...orderKeys.trips(), 'list', { params }],
  tripDetail: (id) => [...orderKeys.trips(), 'detail', id],

  cargo: () => ['cargo'],
  cargoList: (params) => [...orderKeys.cargo(), 'list', { params }],
  cargoDetail: (id) => [...orderKeys.cargo(), 'detail', id],

  deliveries: () => ['deliveries'],
  deliveryList: (params) => [...orderKeys.deliveries(), 'list', { params }],
  deliveryDetail: (id) => [...orderKeys.deliveries(), 'detail', id],
}

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
const handleApiError = (error, customMessage) => {
  let message = customMessage;
  if (error.response?.data) {
    if (error.response.data.detail) {
      message = error.response.data.detail;
    } else if (error.response.data.message) {
      message = error.response.data.message;
    } else if (typeof error.response.data === 'object') {
      const fields = Object.entries(error.response.data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`);
      if (fields.length > 0) message = fields.join(' | ');
    }
  } else if (error.message) {
    message = error.message;
  }
  
  toast.error(message, { duration: 5000 })
  console.error(`Order Service Error [${customMessage}]:`, JSON.stringify(error.response?.data || error, null, 2))
}

// ─── 1. ORDER (LR) HOOKS ─────────────────────────────────────────────────────

export const useOrders = (params) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch orders'),
  })
}

export const useOrderDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch order details'),
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      toast.success('Order (LR) created successfully')
    },
    onError: (err) => handleApiError(err, 'Could not create order'),
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // logic to switch between patch (update) and put (replace) if needed
    mutationFn: ({ id, data, fullReplace = false }) => 
      fullReplace ? ordersApi.replace(id, data) : ordersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) })
      toast.success('Order updated successfully')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Order cancelled')
    },
    onError: (err) => handleApiError(err, 'Failed to cancel order'),
  })
}

export const useAssignTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ordersApi.assignTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('Trip assigned to order successfully')
    },
    onError: (err) => handleApiError(err, 'Trip assignment failed'),
  })
}

// ─── 2. TRIP HOOKS ───────────────────────────────────────────────────────────

export const useTrips = (params) => {
  return useQuery({
    queryKey: orderKeys.tripList(params),
    queryFn: () => tripsApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch trips'),
  })
}

export const useTripDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.tripDetail(id),
    queryFn: () => tripsApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch trip details'),
  })
}

export const useCreateTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('Trip created successfully')
    },
    onError: (err) => handleApiError(err, 'Could not create trip'),
  })
}

// ─── 3. CARGO HOOKS ──────────────────────────────────────────────────────────

export const useCargoItems = (params) => {
  return useQuery({
    queryKey: orderKeys.cargoList(params),
    queryFn: () => cargoApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch cargo items'),
  })
}

export const useCargoDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.cargoDetail(id),
    queryFn: () => cargoApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch cargo detail'),
  })
}

export const useCreateCargo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => cargoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      toast.success('Cargo item added')
    },
    onError: (err) => handleApiError(err, 'Failed to add cargo'),
  })
}

// ─── 4. DELIVERY (POD) HOOKS ─────────────────────────────────────────────────

export const useDeliveries = (params) => {
  return useQuery({
    queryKey: orderKeys.deliveryList(params),
    queryFn: () => deliveriesApi.list(params),
    onError: (err) => handleApiError(err, 'Failed to fetch POD records'),
  })
}

export const useDeliveryDetail = (id) => {
  return useQuery({
    queryKey: orderKeys.deliveryDetail(id),
    queryFn: () => deliveriesApi.get(id),
    enabled: !!id,
    onError: (err) => handleApiError(err, 'Failed to fetch delivery record'),
  })
}

export const useCreatePOD = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => deliveriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveries() })
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('Proof of Delivery recorded')
    },
    onError: (err) => handleApiError(err, 'Failed to create POD'),
  })
}