import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const documentKeys = {
  all: ['driver-documents'],
  lists: () => [...documentKeys.all, 'list'],
  list: (params) => [...documentKeys.lists(), params],
  byDriver: (driverId) => [...documentKeys.all, 'driver', driverId],
  detail: (id) => [...documentKeys.all, 'detail', id],
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
    case 404: throw new Error('Document not found.');
    case 409: throw new Error('Document already exists.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};

// ─── 1. useDocuments (All Documents - List) ───────────────
// params: { driver, document_type, verification_status }
export const useDocuments = (params = {}) => {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getDocuments({ ...params, ordering: 'id' });
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

// ─── 2. useDriverDocuments (Documents by Driver ID) ───────
// Uses filter param instead of nested route
export const useDriverDocuments = (driverId, params = {}) => {
  return useQuery({
    queryKey: documentKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getDocuments({
          driver: driverId, // ← filter param se driver ke documents
          ordering: 'id',
          ...params,
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

// ─── 3. useDocumentById (Single Document) ─────────────────
export const useDocumentById = (id) => {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getDocumentById(id);
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

// ─── 4. useCreateDriverDocument ───────────────────────────
export const useCreateDriverDocument = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createDriverDocument({
      ...data,
      driver: driverId, // ← driver ID body mein attach
    }),
    onSuccess: () => {
      // Refresh documents for this specific driver
      queryClient.invalidateQueries({ queryKey: documentKeys.byDriver(driverId) });
      // Refresh all documents list as well
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdateDriverDocument ───────────────────────────
export const useUpdateDriverDocument = (driverId, documentId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateDriverDocument(documentId, data),
    // ↑ sirf documentId, no driverId in URL
    onSuccess: () => {
      // Refresh the specific document
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
      // Refresh all documents for this driver
      queryClient.invalidateQueries({ queryKey: documentKeys.byDriver(driverId) });
      // Refresh all documents list as well
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeleteDriverDocument ───────────────────────────
export const useDeleteDriverDocument = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId) => driverApi.deleteDriverDocument(documentId),
    // ↑ sirf documentId, no driverId in URL
    onSuccess: (_, deletedDocumentId) => {
      // Remove deleted document from cache immediately
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedDocumentId) });
      // Refresh documents for this driver
      queryClient.invalidateQueries({ queryKey: documentKeys.byDriver(driverId) });
      // Refresh all documents list as well
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};
