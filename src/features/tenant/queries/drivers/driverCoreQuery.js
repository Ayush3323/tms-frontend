import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const driverKeys = {
  all: ['drivers'],
  lists: () => [...driverKeys.all, 'list'],
  list: (filters) => [...driverKeys.lists(), filters],
  detail: (id) => [...driverKeys.all, 'detail', id],
};

// ─── Error Handler ────────────────────────────────────────
const handleError = (error) => {
  if (!error.response) {
    throw new Error('Network error. Please check your connection.');
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 400 && data) {
    // 1. Recursive helper to find the first error message
    const getFirstError = (obj, prefix = '') => {
      if (typeof obj === 'string') return `${prefix}${obj}`;
      if (Array.isArray(obj)) return getFirstError(obj[0], prefix);
      if (typeof obj === 'object' && obj !== null) {
        const keys = Object.keys(obj);
        // Prioritize 'details' if it's a validation error
        if (keys.includes('details')) return getFirstError(obj.details, prefix);
        // Skip generic wrapper if it's the only key
        if (keys.length === 1 && (keys[0] === 'error' || keys[0] === 'errors')) {
          return getFirstError(obj[keys[0]], prefix);
        }
        // General recursion, but skip generic keys at the top level
        const filteredKeys = keys.filter(k => !['code', 'message', 'detail', 'status'].includes(k));
        const keyToUse = filteredKeys.length > 0 ? filteredKeys[0] : keys[0];
        if (!keyToUse) return null;

        const newPrefix = ['error', 'errors', 'details'].includes(keyToUse) ? prefix : (prefix ? `${prefix}${keyToUse}: ` : `${keyToUse}: `);
        return getFirstError(obj[keyToUse], newPrefix);
      }
      return null;
    };

    const specificError = getFirstError(data);
    if (specificError) throw new Error(specificError);
  }

  switch (status) {
    case 401: throw new Error('Session expired. Please login again.');
    case 403: throw new Error('You do not have permission to perform this action.');
    case 404: throw new Error('Resource not found.');
    case 409: throw new Error('Duplicate entry found.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || data?.detail || 'Validation failed.');
  }
};


// ─── 1. useDrivers (List) ─────────────────────────────────
// params: { status, driver_type, license_type, search, page, page_size }
export const useDrivers = (params = {}) => {
  return useQuery({
    queryKey: driverKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getDrivers(params);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },
    staleTime: 0,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

// ─── 2. useDriverDetail (Single Driver) ───────────────────
export const useDriverDetail = (id) => {
  return useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getDriverById(id);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },
    enabled: !!id,  // Skip query if id is not available
    staleTime: 0,
    retry: 0,
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
export const useUpdateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => driverApi.updateDriver(id, data),
    onSuccess: (_, { id }) => {
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
    onSuccess: () => {
      // Refresh EVERYTHING related to drivers to ensure no stale data in any list/filter
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDriverLookup (ID -> Name Map) ──────────────────
export const useDriverLookup = () => {
  const { data } = useDrivers({ page_size: 1000 });

  return useMemo(() => {
    const map = {};
    data?.results?.forEach(d => {
      map[d.id] = {
        name: `${d.user?.first_name || ''} ${d.user?.last_name || ''}`.trim() || 'System Driver',
        employee_id: d.employee_id
      };
    });
    return map;
  }, [data]);
};