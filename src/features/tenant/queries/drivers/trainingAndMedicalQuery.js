import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const trainingKeys = {
  all: ['driver-training-records'],
  lists: () => [...trainingKeys.all, 'list'],
  list: (params) => [...trainingKeys.lists(), params],
  byDriver: (driverId) => [...trainingKeys.all, 'driver', driverId],
  detail: (id) => [...trainingKeys.all, 'detail', id],
};

export const medicalKeys = {
  all: ['driver-medical-records'],
  lists: () => [...medicalKeys.all, 'list'],
  list: (params) => [...medicalKeys.lists(), params],
  byDriver: (driverId) => [...medicalKeys.all, 'driver', driverId],
  detail: (id) => [...medicalKeys.all, 'detail', id],
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
    case 404: throw new Error('Record not found.');
    default:
      if (status >= 500) throw new Error('Server error. Please try again later.');
      throw new Error(data?.message || 'Something went wrong.');
  }
};

// ════════════════════════════════════════════════════════════
//  TRAINING RECORDS
// ════════════════════════════════════════════════════════════

// ─── 1. useTrainingRecords (All Training - List) ──────────
// params: { driver, training_type, status }
export const useTrainingRecords = (params = {}) => {
  return useQuery({
    queryKey: trainingKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getTrainingRecords({ ...params, ordering: 'id' }); // ← fixed
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => {
            const idA = String(a.id);
            const idB = String(b.id);
            return idB.localeCompare(idA, undefined, { numeric: true });
          });
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

// ─── 2. useDriverTrainingRecords (Training by Driver ID) ──
// Pass driverId → returns all training records for that driver
export const useDriverTrainingRecords = (driverId) => {
  return useQuery({
    queryKey: trainingKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getTrainingRecords({ driver: driverId, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => {
            const idA = String(a.id);
            const idB = String(b.id);
            return idB.localeCompare(idA, undefined, { numeric: true });
          });
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

// ─── 3. useTrainingRecordById (Single Training Record) ────
export const useTrainingRecordById = (id) => {
  return useQuery({
    queryKey: trainingKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getTrainingRecordById(id); // ← fixed
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

// ─── 4. useCreateTrainingRecord ───────────────────────────
export const useCreateTrainingRecord = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createTrainingRecord({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh training records for this specific driver
      queryClient.invalidateQueries({ queryKey: trainingKeys.byDriver(driverId) });
      // Refresh all training records list as well
      queryClient.invalidateQueries({ queryKey: trainingKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdateTrainingRecord ───────────────────────────
export const useUpdateTrainingRecord = (driverId, recordId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateTrainingRecord(recordId, data),
    onSuccess: () => {
      // Refresh the specific training record
      queryClient.invalidateQueries({ queryKey: trainingKeys.detail(recordId) });
      // Refresh all training records for this driver
      queryClient.invalidateQueries({ queryKey: trainingKeys.byDriver(driverId) });
      // Refresh all training records list as well
      queryClient.invalidateQueries({ queryKey: trainingKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeleteTrainingRecord ───────────────────────────
export const useDeleteTrainingRecord = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordId) => driverApi.deleteTrainingRecord(recordId),
    onSuccess: (_, deletedRecordId) => {
      // Remove deleted record from cache immediately
      queryClient.removeQueries({ queryKey: trainingKeys.detail(deletedRecordId) });
      // Refresh training records for this driver
      queryClient.invalidateQueries({ queryKey: trainingKeys.byDriver(driverId) });
      // Refresh all training records list as well
      queryClient.invalidateQueries({ queryKey: trainingKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ════════════════════════════════════════════════════════════
//  MEDICAL RECORDS
// ════════════════════════════════════════════════════════════

// ─── 7. useMedicalRecords (All Medical - List) ────────────
// params: { driver, fitness_status }
export const useMedicalRecords = (params = {}) => {
  return useQuery({
    queryKey: medicalKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getMedicalRecords({ ...params, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => {
            const idA = String(a.id);
            const idB = String(b.id);
            return idB.localeCompare(idA, undefined, { numeric: true });
          });
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
  });
};

// ─── 8. useDriverMedicalRecords (Medical by Driver ID) ────
// Pass driverId → returns all medical records for that driver
export const useDriverMedicalRecords = (driverId) => {
  return useQuery({
    queryKey: medicalKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getMedicalRecords({ driver: driverId, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => {
            const idA = String(a.id);
            const idB = String(b.id);
            return idB.localeCompare(idA, undefined, { numeric: true });
          });
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

// ─── 9. useMedicalRecordById (Single Medical Record) ──────
export const useMedicalRecordById = (id) => {
  return useQuery({
    queryKey: medicalKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getMedicalRecordById(id);
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

// ─── 10. useCreateMedicalRecord ───────────────────────────
export const useCreateMedicalRecord = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createMedicalRecord({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh medical records for this specific driver
      queryClient.invalidateQueries({ queryKey: medicalKeys.byDriver(driverId) });
      // Refresh all medical records list as well
      queryClient.invalidateQueries({ queryKey: medicalKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 11. useUpdateMedicalRecord ───────────────────────────
export const useUpdateMedicalRecord = (driverId, recordId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateMedicalRecord(recordId, data),
    onSuccess: () => {
      // Refresh the specific medical record
      queryClient.invalidateQueries({ queryKey: medicalKeys.detail(recordId) });
      // Refresh all medical records for this driver
      queryClient.invalidateQueries({ queryKey: medicalKeys.byDriver(driverId) });
      // Refresh all medical records list as well
      queryClient.invalidateQueries({ queryKey: medicalKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 12. useDeleteMedicalRecord ───────────────────────────
export const useDeleteMedicalRecord = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordId) => driverApi.deleteMedicalRecord(recordId),
    onSuccess: (_, deletedRecordId) => {
      // Remove deleted record from cache immediately
      queryClient.removeQueries({ queryKey: medicalKeys.detail(deletedRecordId) });
      // Refresh medical records for this driver
      queryClient.invalidateQueries({ queryKey: medicalKeys.byDriver(driverId) });
      // Refresh all medical records list as well
      queryClient.invalidateQueries({ queryKey: medicalKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};
