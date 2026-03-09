import axiosInstance from './axiosInstance'

const BASE = '/admin/api/v1/tenants/tenants'

export const tenantsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE}/${id}/`).then(r => r.data),

  suspend: (id, reason) =>
    axiosInstance.post(`${BASE}/${id}/suspend/`, { reason }).then(r => r.data),

  activate: (id) =>
    axiosInstance.post(`${BASE}/${id}/activate/`).then(r => r.data),

  verify: (id, notes) =>
    axiosInstance.post(`${BASE}/${id}/verify/`, { notes }).then(r => r.data),

  statistics: () =>
    axiosInstance.get(`${BASE}/statistics/`).then(r => r.data),
}