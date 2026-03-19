import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const contactKeys = {
  all: ['driver-emergency-contacts'],
  lists: () => [...contactKeys.all, 'list'],
  list: (params) => [...contactKeys.lists(), params],
  byDriver: (driverId) => [...contactKeys.all, 'driver', driverId],
  detail: (id) => [...contactKeys.all, 'detail', id],
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
    case 404: throw new Error('Emergency contact not found.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};

// ─── 1. useEmergencyContacts (All Contacts - List) ────────
// params: { driver, is_primary }
export const useEmergencyContacts = (params = {}) => {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getEmergencyContacts(params);
        return response.data;
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

// ─── 2. useDriverContacts (Contacts by Driver ID) ─────────
// Pass driverId → returns all contacts for that driver
export const useDriverContacts = (driverId) => {
  return useQuery({
    queryKey: contactKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getEmergencyContacts({ driver: driverId });
        return response.data;
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

// ─── 3. useEmergencyContactById (Single Contact) ──────────
export const useEmergencyContactById = (id) => {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getEmergencyContactById(id);
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

// ─── 4. useCreateEmergencyContact ─────────────────────────
export const useCreateEmergencyContact = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createEmergencyContact({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh contacts for this specific driver
      queryClient.invalidateQueries({ queryKey: contactKeys.byDriver(driverId) });
      // Refresh all contacts list as well
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdateEmergencyContact ─────────────────────────
export const useUpdateEmergencyContact = (driverId, contactId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateEmergencyContact(contactId, data),
    onSuccess: () => {
      // Refresh the specific contact
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
      // Refresh all contacts for this driver
      queryClient.invalidateQueries({ queryKey: contactKeys.byDriver(driverId) });
      // Refresh all contacts list as well
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeleteEmergencyContact ─────────────────────────
export const useDeleteEmergencyContact = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId) => driverApi.deleteEmergencyContact(contactId),
    onSuccess: (_, deletedContactId) => {
      // Remove deleted contact from cache immediately
      queryClient.removeQueries({ queryKey: contactKeys.detail(deletedContactId) });
      // Refresh contacts for this driver
      queryClient.invalidateQueries({ queryKey: contactKeys.byDriver(driverId) });
      // Refresh all contacts list as well
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};