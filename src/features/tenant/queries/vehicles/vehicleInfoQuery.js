import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  vehicleDocumentsApi,
  vehicleInsurancesApi,
  maintenanceSchedulesApi,
  maintenanceRecordsApi,
  vehicleInspectionsApi,
  vehicleFuelLogsApi,
  vehicleTiresApi,
  vehicleAccessoriesApi,
  vehicleTollTagsApi,
  vehicleOwnershipApi
} from '../api/vehicleEndpoints'

import { toast } from 'react-hot-toast'


// ───────── COMMON ERROR HANDLER ─────────

const parseError = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong"


// Helper for invalidation
const invalidate = (qc, key) =>
  qc.invalidateQueries({ queryKey: [key] })



/* =====================================================
   VEHICLE DOCUMENTS
===================================================== */

export const useVehicleDocuments = (params) =>
  useQuery({
    queryKey: ['vehicleDocuments', params],
    queryFn: () => vehicleDocumentsApi.list(params),
    onError: (e) => toast.error(parseError(e))
  })

export const useVehicleDocument = (id) =>
  useQuery({
    queryKey: ['vehicleDocument', id],
    queryFn: () => vehicleDocumentsApi.get(id),
    enabled: !!id,
    onError: (e) => toast.error(parseError(e))
  })

export const useCreateVehicleDocument = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleDocumentsApi.create,

    onSuccess: () => {
      invalidate(qc, 'vehicleDocuments')
      toast.success("Document created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleDocument = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleDocumentsApi.update(id, data),

    onSuccess: () => {
      invalidate(qc, 'vehicleDocuments')
      toast.success("Document updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleDocument = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleDocumentsApi.delete,

    onSuccess: () => {
      invalidate(qc, 'vehicleDocuments')
      toast.success("Document deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   VEHICLE INSURANCES
===================================================== */

export const useVehicleInsurances = (params) =>
  useQuery({
    queryKey: ['vehicleInsurances', params],
    queryFn: () => vehicleInsurancesApi.list(params),
    onError: (e) => toast.error(parseError(e))
  })

export const useVehicleInsurance = (id) =>
  useQuery({
    queryKey: ['vehicleInsurance', id],
    queryFn: () => vehicleInsurancesApi.get(id),
    enabled: !!id
  })

export const useCreateVehicleInsurance = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleInsurancesApi.create,

    onSuccess: () => {
      invalidate(qc, 'vehicleInsurances')
      toast.success("Insurance created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleInsurance = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleInsurancesApi.update(id, data),

    onSuccess: () => {
      invalidate(qc, 'vehicleInsurances')
      toast.success("Insurance updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleInsurance = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleInsurancesApi.delete,

    onSuccess: () => {
      invalidate(qc, 'vehicleInsurances')
      toast.success("Insurance deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   MAINTENANCE SCHEDULES
===================================================== */

export const useMaintenanceSchedules = (params) =>
  useQuery({
    queryKey: ['maintenanceSchedules', params],
    queryFn: () => maintenanceSchedulesApi.list(params)
  })

export const useMaintenanceSchedule = (id) =>
  useQuery({
    queryKey: ['maintenanceSchedule', id],
    queryFn: () => maintenanceSchedulesApi.get(id),
    enabled: !!id
  })

export const useCreateMaintenanceSchedule = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: maintenanceSchedulesApi.create,

    onSuccess: () => {
      invalidate(qc, 'maintenanceSchedules')
      toast.success("Schedule created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateMaintenanceSchedule = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      maintenanceSchedulesApi.update(id, data),

    onSuccess: () => {
      invalidate(qc, 'maintenanceSchedules')
      toast.success("Schedule updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteMaintenanceSchedule = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: maintenanceSchedulesApi.delete,

    onSuccess: () => {
      invalidate(qc, 'maintenanceSchedules')
      toast.success("Schedule deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   MAINTENANCE RECORDS
===================================================== */

export const useMaintenanceRecords = (params) =>
  useQuery({
    queryKey: ['maintenanceRecords', params],
    queryFn: () => maintenanceRecordsApi.list(params)
  })

export const useMaintenanceRecord = (id) =>
  useQuery({
    queryKey: ['maintenanceRecord', id],
    queryFn: () => maintenanceRecordsApi.get(id),
    enabled: !!id
  })

export const useCreateMaintenanceRecord = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: maintenanceRecordsApi.create,

    onSuccess: () => {
      invalidate(qc, 'maintenanceRecords')
      toast.success("Record created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateMaintenanceRecord = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      maintenanceRecordsApi.update(id, data),

    onSuccess: () => {
      invalidate(qc, 'maintenanceRecords')
      toast.success("Record updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteMaintenanceRecord = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: maintenanceRecordsApi.delete,

    onSuccess: () => {
      invalidate(qc, 'maintenanceRecords')
      toast.success("Record deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   VEHICLE INSPECTIONS
===================================================== */

export const useVehicleInspections = (params) =>
  useQuery({
    queryKey: ['vehicleInspections', params],
    queryFn: () => vehicleInspectionsApi.list(params)
  })

export const useVehicleInspection = (id) =>
  useQuery({
    queryKey: ['vehicleInspection', id],
    queryFn: () => vehicleInspectionsApi.get(id),
    enabled: !!id
  })

export const useCreateVehicleInspection = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleInspectionsApi.create,

    onSuccess: () => {
      invalidate(qc, 'vehicleInspections')
      toast.success("Inspection created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleInspection = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleInspectionsApi.update(id, data),

    onSuccess: () => {
      invalidate(qc, 'vehicleInspections')
      toast.success("Inspection updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleInspection = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleInspectionsApi.delete,

    onSuccess: () => {
      invalidate(qc, 'vehicleInspections')
      toast.success("Inspection deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   FUEL LOGS
===================================================== */

export const useVehicleFuelLogs = (params) =>
  useQuery({
    queryKey: ['vehicleFuelLogs', params],
    queryFn: () => vehicleFuelLogsApi.list(params)
  })

export const useVehicleFuelLog = (id) =>
  useQuery({
    queryKey: ['vehicleFuelLog', id],
    queryFn: () => vehicleFuelLogsApi.get(id),
    enabled: !!id
  })

export const useCreateFuelLog = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleFuelLogsApi.create,

    onSuccess: () => {
      invalidate(qc, 'vehicleFuelLogs')
      toast.success("Fuel log created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateFuelLog = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleFuelLogsApi.update(id, data),

    onSuccess: () => {
      invalidate(qc, 'vehicleFuelLogs')
      toast.success("Fuel log updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteFuelLog = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleFuelLogsApi.delete,

    onSuccess: () => {
      invalidate(qc, 'vehicleFuelLogs')
      toast.success("Fuel log deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}


/* =====================================================
   VEHICLE TIRES
===================================================== */

export const useVehicleTires = (params) =>
  useQuery({
    queryKey: ['vehicleTires', params],
    queryFn: () => vehicleTiresApi.list(params),
    onError: (e) => toast.error(parseError(e))
  })

export const useVehicleTire = (id) =>
  useQuery({
    queryKey: ['vehicleTire', id],
    queryFn: () => vehicleTiresApi.get(id),
    enabled: !!id
  })

export const useCreateVehicleTire = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleTiresApi.create,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTires'] })
      toast.success("Tire created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleTire = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleTiresApi.update(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTires'] })
      toast.success("Tire updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleTire = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleTiresApi.delete,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTires'] })
      toast.success("Tire deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   VEHICLE ACCESSORIES
===================================================== */

export const useVehicleAccessories = (params) =>
  useQuery({
    queryKey: ['vehicleAccessories', params],
    queryFn: () => vehicleAccessoriesApi.list(params),
    onError: (e) => toast.error(parseError(e))
  })

export const useVehicleAccessory = (id) =>
  useQuery({
    queryKey: ['vehicleAccessory', id],
    queryFn: () => vehicleAccessoriesApi.get(id),
    enabled: !!id
  })

export const useCreateVehicleAccessory = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleAccessoriesApi.create,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleAccessories'] })
      toast.success("Accessory created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleAccessory = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleAccessoriesApi.update(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleAccessories'] })
      toast.success("Accessory updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleAccessory = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleAccessoriesApi.delete,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleAccessories'] })
      toast.success("Accessory deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   VEHICLE TOLL TAGS
===================================================== */

export const useVehicleTollTags = (params) =>
  useQuery({
    queryKey: ['vehicleTollTags', params],
    queryFn: () => vehicleTollTagsApi.list(params),
    onError: (e) => toast.error(parseError(e))
  })

export const useVehicleTollTag = (id) =>
  useQuery({
    queryKey: ['vehicleTollTag', id],
    queryFn: () => vehicleTollTagsApi.get(id),
    enabled: !!id
  })

export const useCreateVehicleTollTag = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleTollTagsApi.create,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTollTags'] })
      toast.success("Toll tag created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleTollTag = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleTollTagsApi.update(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTollTags'] })
      toast.success("Toll tag updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleTollTag = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleTollTagsApi.delete,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleTollTags'] })
      toast.success("Toll tag deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}



/* =====================================================
   VEHICLE OWNERSHIP HISTORY
===================================================== */

export const useVehicleOwnership = (params) =>
  useQuery({
    queryKey: ['vehicleOwnership', params],
    queryFn: () => vehicleOwnershipApi.list(params),
    onError: (e) => toast.error(parseError(e))
  })

export const useVehicleOwnershipItem = (id) =>
  useQuery({
    queryKey: ['vehicleOwnershipItem', id],
    queryFn: () => vehicleOwnershipApi.get(id),
    enabled: !!id
  })

export const useCreateVehicleOwnership = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleOwnershipApi.create,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleOwnership'] })
      toast.success("Ownership record created")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useUpdateVehicleOwnership = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) =>
      vehicleOwnershipApi.update(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleOwnership'] })
      toast.success("Ownership updated")
    },

    onError: (e) => toast.error(parseError(e))
  })
}

export const useDeleteVehicleOwnership = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: vehicleOwnershipApi.delete,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicleOwnership'] })
      toast.success("Ownership deleted")
    },

    onError: (e) => toast.error(parseError(e))
  })
}