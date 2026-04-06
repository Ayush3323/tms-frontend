import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  ordersApi, 
  tripsApi, 
  cargoApi, 
  deliveriesApi,
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
   tripStops: (id) => [...orderKeys.tripDetail(id), 'stops'],
   tripStatusHistory: (id) => [...orderKeys.tripDetail(id), 'status-history'],
   tripDocuments: (id) => [...orderKeys.tripDetail(id), 'documents'],
   tripExpenses: (id) => [...orderKeys.tripDetail(id), 'expenses'],
   tripCharges: (id) => [...orderKeys.tripDetail(id), 'charges'],

  cargo: () => ['cargo'],
  cargoList: (params) => [...orderKeys.cargo(), 'list', { params }],
  cargoDetail: (id) => [...orderKeys.cargo(), 'detail', id],

  deliveries: () => ['deliveries'],
  deliveryList: (params) => [...orderKeys.deliveries(), 'list', { params }],
  deliveryDetail: (id) => [...orderKeys.deliveries(), 'detail', id],
}

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
const formatError = (error) => {
  if (!error) return 'An unexpected error occurred.';
  const data = error.response?.data;
  if (!data) return error.message || 'An unexpected error occurred.';
  const errObj = data.error || data;
  
  // Mapping technical phrases to human-friendly ones
  const friendlyMap = {
    "Must be a valid UUID.": "Please select a valid option from the list.",
    "This field may not be blank.": "This field is required.",
    "This field is required.": "This field is required.",
  };

  if (errObj.message && typeof errObj.message === 'string' && !errObj.details) {
    let msg = errObj.message;
    Object.entries(friendlyMap).forEach(([tech, friendly]) => {
      msg = msg.replace(tech, friendly);
    });
    return msg;
  }

  if (errObj.details && typeof errObj.details === 'object') {
    const messages = [];
    const extract = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        let fieldName = key.replace(/_/g, ' ');
        if (key === 'order_id') fieldName = 'order';
        const label = prefix ? `${prefix} ${fieldName}` : fieldName;
        if (Array.isArray(value)) {
          const valStr = value.map(v => {
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
            return friendlyMap[s] || s;
          }).join(' ');
          messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${valStr}`);
        } else if (typeof value === 'object' && value !== null) {
          extract(value, fieldName === 'driver' || fieldName === 'user' ? '' : label);
        } else {
          const s = String(value);
          const valStr = friendlyMap[s] || s;
          messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${valStr}`);
        }
      });
    };
    extract(errObj.details);
    if (messages.length > 0) return messages.join(' | ');
  }
  return errObj.message || data.message || error.message || 'An unexpected error occurred.';
};

const handleApiError = (error, customMessage) => {
  const message = formatError(error);
  toast.error(`${customMessage}: ${message}`, { duration: 5000 })
  console.error(`Order Service Error [${customMessage}]:`, JSON.stringify(error.response?.data || error, null, 2))
}

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
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

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Order deleted successfully')
    },
    onError: (err) => handleApiError(err, 'Failed to delete order'),
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
    mutationFn: async (data) => {
      const trip = await tripsApi.create(data);
      if (data.order_id) {
        try {
          await ordersApi.update(data.order_id, { status: 'ASSIGNED' });
        } catch (err) {
          console.error("Order status update failed:", err);
          // We don't fail the whole trip creation if order update fails, 
          // but we log it.
        }
      }
      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Trip created successfully')
    },
    onError: (err) => handleApiError(err, 'Trip creation failed'),
  })
}

export const useUpdateTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data, fullReplace = false }) => {
      const response = fullReplace ? await tripsApi.replace(id, data) : await tripsApi.update(id, data);
      
      // If trip's order is updated, we also ensure the order is marked as ASSIGNED
      if (data.order_id) {
        try {
          await ordersApi.update(data.order_id, { status: 'ASSIGNED' });
        } catch (err) {
          console.error("Order status update failed (on trip update):", err);
        }
      }
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDetail(id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
      toast.success('Trip updated successfully')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}

export const useDeleteTrip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => tripsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.trips() })
      toast.success('Trip deleted successfully')
    },
    onError: (err) => handleApiError(err, 'Failed to delete trip'),
  })
}

// ─── 2.1 TRIP SUB-RESOURCE HOOKS ─────────────────────────────────────────────

export const useTripStops = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripStops(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listStops(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip stops'),
  })
}

export const useCreateTripStop = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createStop(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripStops(tripId) })
      toast.success('Trip stop added')
    },
    onError: (err) => handleApiError(err, 'Failed to add trip stop'),
  })
}

export const useUpdateTripStop = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stopId, data }) => tripsApi.updateStop(tripId, stopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripStops(tripId) })
      toast.success('Trip stop updated')
    },
    onError: (err) => handleApiError(err, 'Failed to update trip stop'),
  })
}

export const useDeleteTripStop = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stopId) => tripsApi.deleteStop(tripId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripStops(tripId) })
      toast.success('Trip stop deleted')
    },
    onError: (err) => handleApiError(err, 'Failed to delete trip stop'),
  })
}

export const useTripStatusHistory = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripStatusHistory(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listStatusHistory(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip history'),
  })
}

export const useTripDocuments = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripDocuments(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listDocuments(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip documents'),
  })
}

export const useCreateTripDocument = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createDocument(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripDocuments(tripId) })
      toast.success('Document uploaded')
    },
    onError: (err) => handleApiError(err, 'Failed to upload document'),
  })
}

export const useTripExpenses = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripExpenses(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listExpenses(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip expenses'),
  })
}

export const useCreateTripExpense = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createExpense(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripExpenses(tripId) })
      toast.success('Expense recorded')
    },
    onError: (err) => handleApiError(err, 'Failed to record expense'),
  })
}

export const useTripCharges = (tripId) => {
  return useQuery({
    queryKey: orderKeys.tripCharges(tripId),
    queryFn: async () => normalizeListResponse(await tripsApi.listCharges(tripId)),
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip charges'),
  })
}

export const useCreateTripCharge = (tripId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tripsApi.createCharge(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tripCharges(tripId) })
      toast.success('Charge added')
    },
    onError: (err) => handleApiError(err, 'Failed to add charge'),
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

export const useUpdateCargo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, fullReplace = false }) => 
      fullReplace ? cargoApi.replace(id, data) : cargoApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.cargo() })
      queryClient.invalidateQueries({ queryKey: orderKeys.cargoDetail(id) })
      toast.success('Cargo item updated successfully')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
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

export const useTripDeliveries = (tripId) => {
  return useQuery({
    queryKey: [...orderKeys.deliveries(), 'trip', tripId],
    queryFn: async () => {
      const raw = await deliveriesApi.list(tripId ? { trip_id: tripId } : {})
      const rows = normalizeListResponse(raw)
      if (!tripId) return rows
      return rows.filter((d) => String(d.trip_id) === String(tripId))
    },
    enabled: !!tripId,
    onError: (err) => handleApiError(err, 'Failed to fetch trip deliveries'),
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

export const useUpdateDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, fullReplace = false }) => 
      fullReplace ? deliveriesApi.replace(id, data) : deliveriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveries() })
      queryClient.invalidateQueries({ queryKey: orderKeys.deliveryDetail(id) })
      toast.success('Delivery record updated')
    },
    onError: (err) => handleApiError(err, 'Update failed'),
  })
}