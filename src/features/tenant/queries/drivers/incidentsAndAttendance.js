import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverApi from '../../api/drivers/driverEndpoint';

// ─── Query Keys ───────────────────────────────────────────
export const incidentKeys = {
  all: ['driver-incidents'],
  lists: () => [...incidentKeys.all, 'list'],
  list: (params) => [...incidentKeys.lists(), params],
  byDriver: (driverId) => [...incidentKeys.all, 'driver', driverId],
  detail: (id) => [...incidentKeys.all, 'detail', id],
};

export const attendanceKeys = {
  all: ['driver-attendance'],
  lists: () => [...attendanceKeys.all, 'list'],
  list: (params) => [...attendanceKeys.lists(), params],
  byDriver: (driverId) => [...attendanceKeys.all, 'driver', driverId],
  detail: (id) => [...attendanceKeys.all, 'detail', id],
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
//  INCIDENTS
// ════════════════════════════════════════════════════════════

// ─── 1. useIncidents (All Incidents - List) ───────────────
// params: { driver, incident_type, severity, resolution_status }
export const useIncidents = (params = {}) => {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getIncidents({ ...params, ordering: 'id' });
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

// ─── 2. useDriverIncidents (Incidents by Driver ID) ───────
export const useDriverIncidents = (driverId) => {
  return useQuery({
    queryKey: incidentKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getIncidents({ driver: driverId, ordering: 'id' });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => {
            const idA = String(a.id);
            const idB = String(b.id);
            return idB.localeCompare(idA, undefined, { numeric: true });
          });
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

// ─── 3. useIncidentById (Single Incident) ─────────────────
export const useIncidentById = (id) => {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getIncidentById(id);
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

// ─── 4. useCreateIncident ─────────────────────────────────
export const useCreateIncident = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createIncident({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh incidents for this specific driver
      queryClient.invalidateQueries({ queryKey: incidentKeys.byDriver(driverId) });
      // Refresh all incidents list as well
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 5. useUpdateIncident ─────────────────────────────────
// Mainly used for: { resolution_status, resolution_notes }
export const useUpdateIncident = (driverId, incidentId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateIncident(incidentId, data),
    onSuccess: () => {
      // Refresh the specific incident
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incidentId) });
      // Refresh all incidents for this driver
      queryClient.invalidateQueries({ queryKey: incidentKeys.byDriver(driverId) });
      // Refresh all incidents list as well
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 6. useDeleteIncident ─────────────────────────────────
export const useDeleteIncident = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incidentId) => driverApi.deleteIncident(incidentId),
    onSuccess: (_, deletedIncidentId) => {
      // Remove deleted incident from cache immediately
      queryClient.removeQueries({ queryKey: incidentKeys.detail(deletedIncidentId) });
      // Refresh incidents for this driver
      queryClient.invalidateQueries({ queryKey: incidentKeys.byDriver(driverId) });
      // Refresh all incidents list as well
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ════════════════════════════════════════════════════════════
//  ATTENDANCE
// ════════════════════════════════════════════════════════════

// ─── 7. useAttendance (All Attendance - List) ─────────────
// params: { driver, status, date }
export const useAttendance = (params = {}) => {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: async () => {
      try {
        const response = await driverApi.getAttendance({ ...params, ordering: 'id' });
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

// ─── 8. useDriverAttendance (Attendance by Driver ID) ─────
export const useDriverAttendance = (driverId, params = {}) => {
  return useQuery({
    queryKey: attendanceKeys.byDriver(driverId),
    queryFn: async () => {
      try {
        const response = await driverApi.getAttendance({
          driver: driverId,
          ordering: 'id',
          ...params,
        });
        const data = response.data;
        if (data?.results) {
          data.results = [...data.results].sort((a, b) => {
            const idA = String(a.id);
            const idB = String(b.id);
            return idB.localeCompare(idA, undefined, { numeric: true });
          });
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

// ─── 9. useAttendanceById (Single Attendance) ─────────────
export const useAttendanceById = (id) => {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await driverApi.getAttendanceById(id);
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

// ─── 10. useCreateAttendance ──────────────────────────────
export const useCreateAttendance = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.createAttendance({
      ...data,
      driver: driverId, // Automatically attach driver id
    }),
    onSuccess: () => {
      // Refresh attendance for this specific driver
      queryClient.invalidateQueries({ queryKey: attendanceKeys.byDriver(driverId) });
      // Refresh all attendance list as well
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 11. useUpdateAttendance ──────────────────────────────
export const useUpdateAttendance = (driverId, attendanceId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => driverApi.updateAttendance(attendanceId, data),
    onSuccess: () => {
      // Refresh the specific attendance record
      queryClient.invalidateQueries({ queryKey: attendanceKeys.detail(attendanceId) });
      // Refresh all attendance for this driver
      queryClient.invalidateQueries({ queryKey: attendanceKeys.byDriver(driverId) });
      // Refresh all attendance list as well
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

// ─── 12. useDeleteAttendance ──────────────────────────────
export const useDeleteAttendance = (driverId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attendanceId) => driverApi.deleteAttendance(attendanceId),
    onSuccess: (_, deletedAttendanceId) => {
      // Remove deleted attendance from cache immediately
      queryClient.removeQueries({ queryKey: attendanceKeys.detail(deletedAttendanceId) });
      // Refresh attendance for this driver
      queryClient.invalidateQueries({ queryKey: attendanceKeys.byDriver(driverId) });
      // Refresh all attendance list as well
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};
