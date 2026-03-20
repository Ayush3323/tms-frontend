import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const salaryKeys = {
  all: ['driver-salary-structures'],
  lists: () => [...salaryKeys.all, 'list'],
  list: (params) => [...salaryKeys.lists(), params],
  byDriver: (driverId) => [...salaryKeys.all, 'driver', driverId],
  detail: (id) => [...salaryKeys.all, 'detail', id],
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
    case 404: throw new Error('Salary structure not found.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};

// ─── 1. useSalaryStructures (All Salary - List) ───────────
// params: { driver, payment_frequency, effective_from, effective_to }
export const useSalaryStructures = (params = {}) => {
  return useQuery({
    queryKey: salaryKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getSalaryStructures({ ...params, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => b.id.localeCompare(a.id));
        }
        return data;
        // { count, next, previous, results: [...] }
      } catch (error) {
        handleError(error);
      }
    },
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    placeholderData: (prev) => prev,
  });
};

// ─── 2. useDriverSalaryStructures (Salary by Driver ID) ───
// Pass driverId → returns all salary structures for that driver
export const useDriverSalaryStructures = (driverId) => {
  return useQuery({
    queryKey: salaryKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getSalaryStructures({ driver: driverId, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => b.id.localeCompare(a.id));
        }
        return data;
        // { count, next, previous, results: [...] }
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

// ─── 3. useSalaryStructureById (Single Salary Structure) ──
export const useSalaryStructureById = (id) => {
  return useQuery({
    queryKey: salaryKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getSalaryStructureById(id);
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

// ─── 4. useCreateSalaryStructure ──────────────────────────
export const useCreateSalaryStructure = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createSalaryStructure({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh salary structures for this specific driver
      queryClient.invalidateQueries({ queryKey: salaryKeys.byDriver(driverId) });
      // Refresh all salary structures list as well
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdateSalaryStructure ──────────────────────────
export const useUpdateSalaryStructure = (driverId, salaryId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateSalaryStructure(salaryId, data),
    onSuccess: () => {
      // Refresh the specific salary structure
      queryClient.invalidateQueries({ queryKey: salaryKeys.detail(salaryId) });
      // Refresh all salary structures for this driver
      queryClient.invalidateQueries({ queryKey: salaryKeys.byDriver(driverId) });
      // Refresh all salary structures list as well
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeleteSalaryStructure ──────────────────────────
export const useDeleteSalaryStructure = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (salaryId) => driverApi.deleteSalaryStructure(salaryId),
    onSuccess: (_, deletedSalaryId) => {
      // Remove deleted salary structure from cache immediately
      queryClient.removeQueries({ queryKey: salaryKeys.detail(deletedSalaryId) });
      // Refresh salary structures for this driver
      queryClient.invalidateQueries({ queryKey: salaryKeys.byDriver(driverId) });
      // Refresh all salary structures list as well
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};