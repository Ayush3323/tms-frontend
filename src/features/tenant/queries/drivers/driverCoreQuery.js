import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const driverKeys = {
  all:    ['drivers'],
  lists:  () => [...driverKeys.all, 'list'],
  list:   (filters) => [...driverKeys.lists(), filters],
  detail: (id) => [...driverKeys.all, 'detail', id],
};

// ─── Error Handler ────────────────────────────────────────
const handleError = (error) => {
  if (!error.response) {
    throw new Error('Network error. Please check your connection.');
  }

  const status = error.response?.status;
  const data   = error.response?.data;

  switch (status) {
    case 400: {
      const firstKey = Object.keys(data ?? {})[0];

      // Flat error → { "license_number": ["required"] }
      if (firstKey && Array.isArray(data[firstKey])) {
        throw new Error(`${firstKey}: ${data[firstKey][0]}`);
      }

      // Nested error → { "user": { "email": ["already exists"] } }
      if (firstKey && typeof data[firstKey] === 'object') {
        const nestedObj   = data[firstKey];
        const nestedKey   = Object.keys(nestedObj)[0];
        const nestedError = nestedObj[nestedKey];
        if (Array.isArray(nestedError)) {
          throw new Error(`${firstKey}.${nestedKey}: ${nestedError[0]}`);
        }
      }

      throw new Error(data?.message || 'Validation failed.');
    }
    case 401: throw new Error('Session expired. Please login again.');
    case 403: throw new Error('You do not have permission to perform this action.');
    case 404: throw new Error('Driver not found.');
    case 409: throw new Error('Driver with this email or employee ID already exists.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};


// ─── 1. useDrivers (List) ─────────────────────────────────
// params: { status, driver_type, license_type, search, page, page_size }
export const useDrivers = (params = {}) => {
  return useQuery({
    queryKey: driverKeys.list(params),
    queryFn:  async () => {
      try {
        const response = await driverApi.getDrivers(params);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },
    staleTime:            0,     
    retry:                0,     
    refetchOnWindowFocus: false, 
  });
};

// ─── 2. useDriverDetail (Single Driver) ───────────────────
export const useDriverDetail = (id) => {
  return useQuery({
    queryKey: driverKeys.detail(id),
    queryFn:  async () => {
      try {
        const response = await driverApi.getDriverById(id);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },
    enabled:              !!id,  // Skip query if id is not available
    staleTime:            0,
    retry:                0,
    refetchOnWindowFocus: false,
  });
};

// ─── 3. useCreateDriver ───────────────────────────────────
export const useCreateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createDriver(data),
    onSuccess: () => {
      // Refresh drivers list to include newly created driver
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};


export const useRegisterDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.registerDriver(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },

    onError: (error) => {
       handleError(error);
    }
  });
};

// ─── 4. useUpdateDriver ───────────────────────────────────
export const useUpdateDriver = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateDriver(id, data),
    onSuccess: () => {
      // Refresh both detail and list to reflect updated data
      queryClient.invalidateQueries({ queryKey: driverKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useDeleteDriver ───────────────────────────────────
export const useDeleteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => driverApi.deleteDriver(id),
    onSuccess: (_, deletedId) => {
      // Refresh list after deletion
      queryClient.invalidateQueries({ queryKey: driverKeys.lists() });
      // Remove deleted driver's detail from cache immediately
      queryClient.removeQueries({ queryKey: driverKeys.detail(deletedId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};