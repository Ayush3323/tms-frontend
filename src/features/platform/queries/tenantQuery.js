import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsApi } from '../api/tenant.api'


/* =========================
   COMMON ERROR HANDLER
========================= */

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    "Something went wrong"
  )
}


/* =========================
   GET TENANTS LIST
========================= */

export const useTenants = (params) =>
  useQuery({
    queryKey: ['tenants', params],
    queryFn: () => tenantsApi.list(params),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    retry: 2,

    onError: (error) => {
      console.error("Failed to fetch tenants:", getErrorMessage(error))
    }
  })


/* =========================
   GET SINGLE TENANT
========================= */

export const useTenant = (id) =>
  useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantsApi.get(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    retry: 2,

    onError: (error) => {
      console.error("Failed to fetch tenant:", getErrorMessage(error))
    }
  })


/* =========================
   TENANT STATISTICS
========================= */

export const useTenantStats = () =>
  useQuery({
    queryKey: ['tenant-stats'],
    queryFn: tenantsApi.statistics,
    staleTime: 60 * 1000,
    retry: 2,

    select: (data) => ({
      total: data?.total_tenants ?? data?.total ?? 0,
      active: data?.active_tenants ?? data?.active ?? 0,
      pending_verify: data?.pending_verification ?? data?.pending_verify ?? 0,
      suspended: data?.suspended_tenants ?? data?.suspended ?? 0
    }),

    onError: (error) => {
      console.error("Failed to fetch tenant statistics:", getErrorMessage(error))
    }
  })


/* =========================
   CREATE TENANT
========================= */

export const useCreateTenant = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data) => tenantsApi.create(data),
    retry: 1,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant-stats'] })
    },

    onError: (error) => {
      console.error("Failed to create tenant:", getErrorMessage(error))
      alert(getErrorMessage(error))
    }
  })
}


/* =========================
   UPDATE TENANT
========================= */

export const useUpdateTenant = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => tenantsApi.update(id, data),
    retry: 1,

    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tenant', variables.id] })
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },

    onError: (error) => {
      console.error("Failed to update tenant:", getErrorMessage(error))
      alert(getErrorMessage(error))
    }
  })
}


/* =========================
   DELETE TENANT
========================= */

export const useDeleteTenant = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id) => tenantsApi.delete(id),
    retry: 1,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant-stats'] })
    },

    onError: (error) => {
      console.error("Failed to delete tenant:", getErrorMessage(error))
      alert(getErrorMessage(error))
    }
  })
}


/* =========================
   SUSPEND TENANT
========================= */

export const useSuspendTenant = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }) => tenantsApi.suspend(id, reason),
    retry: 1,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant-stats'] })
    },

    onError: (error) => {
      console.error("Failed to suspend tenant:", getErrorMessage(error))
      alert(getErrorMessage(error))
    }
  })
}


/* =========================
   ACTIVATE TENANT
========================= */

export const useActivateTenant = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id) => tenantsApi.activate(id),
    retry: 1,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant-stats'] })
    },

    onError: (error) => {
      console.error("Failed to activate tenant:", getErrorMessage(error))
      alert(getErrorMessage(error))
    }
  })
}


/* =========================
   VERIFY TENANT
========================= */

export const useVerifyTenant = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }) => tenantsApi.verify(id, notes),
    retry: 1,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant-stats'] })
    },

    onError: (error) => {
      console.error("Failed to verify tenant:", getErrorMessage(error))
      alert(getErrorMessage(error))
    }
  })
}