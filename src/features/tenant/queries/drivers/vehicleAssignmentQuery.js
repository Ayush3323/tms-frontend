import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';
import { vehiclesApi } from '../../api/vehicles/vehicleEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const vehicleAssignmentKeys = {
  all: ['driver-vehicle-assignments'],
  lists: () => [...vehicleAssignmentKeys.all, 'list'],
  list: (params) => [...vehicleAssignmentKeys.lists(), params],
  byDriver: (driverId) => [...vehicleAssignmentKeys.all, 'driver', driverId],
  detail: (id) => [...vehicleAssignmentKeys.all, 'detail', id],
};

// Sirf list ki zaroorat hai → dropdown ke liye
export const vehicleKeys = {
  list: (params) => ['vehicles', 'list', params],
};

// ─── Error Handler ────────────────────────────────────────
const handleError = (error) => {
  if (!error.response) {
    throw new Error('Network error. Please check your connection.');
  }

  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400: {
      // Extract first field validation error
      const firstKey = Object.keys(data ?? {})[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        throw new Error(`${firstKey}: ${data[firstKey][0]}`);
      }
      throw new Error(data?.message || 'Validation failed.');
    }
    case 401: throw new Error('Session expired. Please login again.');
    case 403: throw new Error('You do not have permission to perform this action.');
    case 404: throw new Error('Vehicle assignment not found.');
    case 409: throw new Error('Vehicle is already assigned to another driver.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};

// ════════════════════════════════════════════════════════════
//  VEHICLES LIST - For Dropdown (Assign Vehicle Form)
// ════════════════════════════════════════════════════════════

// ─── useVehiclesList ──────────────────────────────────────
// Used in assign vehicle form dropdown
// params: { is_active, status, search }
export const useVehiclesList = (params = {}) => {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    // → ['vehicles', 'list', { is_active: true }]
    queryFn: async () => {
      try {
        const response = await vehiclesApi.list(params);
        // vehiclesApi.list() already returns r.data directly
        return response;
        // { count, results: [{ id, registration_number, vehicle_type, status }] }
      } catch (error) {
        handleError(error);
      }
    },
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

// ════════════════════════════════════════════════════════════
//  VEHICLE ASSIGNMENTS
// ════════════════════════════════════════════════════════════

// ─── 1. useVehicleAssignments (All Assignments - List) ────
// params: { driver }
export const useVehicleAssignments = (params = {}) => {
  return useQuery({
    queryKey: vehicleAssignmentKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getVehicleAssignments({ ...params, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => b.id.localeCompare(a.id));
        }
        return data;
      } catch (error) {
        handleError(error);
      }
    },
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
};

// ─── 2. useDriverVehicleAssignments (Assignments by Driver ID)
export const useDriverVehicleAssignments = (driverId) => {
  return useQuery({
    queryKey: vehicleAssignmentKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getVehicleAssignments({ driver: driverId, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => b.id.localeCompare(a.id));
        }
        return data;
      } catch (error) {
        handleError(error);
      }
    },
    enabled: !!driverId, // Skip query if driverId is not available
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

// ─── 3. useVehicleAssignmentById (Single Assignment) ──────
export const useVehicleAssignmentById = (id) => {
  return useQuery({
    queryKey: vehicleAssignmentKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getVehicleAssignmentById(id);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },
    enabled: !!id, // Skip query if id is not available
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

// ─── 4. useCreateVehicleAssignment ────────────────────────
export const useCreateVehicleAssignment = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createVehicleAssignment({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh assignments for this specific driver
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.byDriver(driverId) });
      // Refresh all assignments list as well
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdateVehicleAssignment ────────────────────────
export const useUpdateVehicleAssignment = (driverId, assignmentId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateVehicleAssignment(assignmentId, data),
    onSuccess: () => {
      // Refresh the specific assignment
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.detail(assignmentId) });
      // Refresh all assignments for this driver
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.byDriver(driverId) });
      // Refresh all assignments list as well
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeleteVehicleAssignment ────────────────────────
export const useDeleteVehicleAssignment = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId) => driverApi.deleteVehicleAssignment(assignmentId),
    onSuccess: (_, deletedAssignmentId) => {
      // Remove deleted assignment from cache immediately
      queryClient.removeQueries({ queryKey: vehicleAssignmentKeys.detail(deletedAssignmentId) });
      // Refresh assignments for this driver
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.byDriver(driverId) });
      // Refresh all assignments list as well
      queryClient.invalidateQueries({ queryKey: vehicleAssignmentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};