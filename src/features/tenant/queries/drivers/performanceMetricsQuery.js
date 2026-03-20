import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const performanceKeys = {
  all: ['driver-performance-metrics'],
  lists: () => [...performanceKeys.all, 'list'],
  list: (params) => [...performanceKeys.lists(), params],
  byDriver: (driverId) => [...performanceKeys.all, 'driver', driverId],
  detail: (id) => [...performanceKeys.all, 'detail', id],
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
    case 404: throw new Error('Performance metric not found.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};

// ─── 1. usePerformanceMetrics (All Metrics - List) ────────
// params: { driver, period_start, period_end }
export const usePerformanceMetrics = (params = {}) => {
  return useQuery({
    queryKey: performanceKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getPerformanceMetrics({ ...params, ordering: 'id' });
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
  });
};

// ─── 2. useDriverPerformanceMetrics (Metrics by Driver ID) 
// Pass driverId → returns all performance metrics for that driver
export const useDriverPerformanceMetrics = (driverId, params = {}) => {
  return useQuery({
    queryKey: performanceKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getPerformanceMetrics({
          driver: driverId,
          ordering: 'id',
          ...params, // period_start, period_end filter bhi pass kar sakte ho
        });
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

// ─── 3. usePerformanceMetricById (Single Metric) ──────────
export const usePerformanceMetricById = (id) => {
  return useQuery({
    queryKey: performanceKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getPerformanceMetricById(id);
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

// ─── 4. useCreatePerformanceMetric ────────────────────────
export const useCreatePerformanceMetric = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createPerformanceMetric({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh performance metrics for this specific driver
      queryClient.invalidateQueries({ queryKey: performanceKeys.byDriver(driverId) });
      // Refresh all performance metrics list as well
      queryClient.invalidateQueries({ queryKey: performanceKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdatePerformanceMetric ────────────────────────
export const useUpdatePerformanceMetric = (driverId, metricId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updatePerformanceMetric(metricId, data),
    onSuccess: () => {
      // Refresh the specific metric
      queryClient.invalidateQueries({ queryKey: performanceKeys.detail(metricId) });
      // Refresh all metrics for this driver
      queryClient.invalidateQueries({ queryKey: performanceKeys.byDriver(driverId) });
      // Refresh all metrics list as well
      queryClient.invalidateQueries({ queryKey: performanceKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeletePerformanceMetric ────────────────────────
export const useDeletePerformanceMetric = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metricId) => driverApi.deletePerformanceMetric(metricId),
    onSuccess: (_, deletedMetricId) => {
      // Remove deleted metric from cache immediately
      queryClient.removeQueries({ queryKey: performanceKeys.detail(deletedMetricId) });
      // Refresh metrics for this driver
      queryClient.invalidateQueries({ queryKey: performanceKeys.byDriver(driverId) });
      // Refresh all metrics list as well
      queryClient.invalidateQueries({ queryKey: performanceKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};
