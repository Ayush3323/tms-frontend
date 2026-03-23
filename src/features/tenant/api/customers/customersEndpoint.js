import axiosInstance from '../axiosInstance'

// ─── 1. CUSTOMERS ────────────────────────────────────────────────────────────

const BASE_CUSTOMERS = 'api/v1/customers'

export const customersApi = {
  health: () =>
    axiosInstance.get(`health/`).then(r => r.data),

  list: (params) =>
    axiosInstance.get(`${BASE_CUSTOMERS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_CUSTOMERS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_CUSTOMERS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_CUSTOMERS}/${id}/`, data).then(r => r.data),

  // Added put specifically as per your requirements list
  replace: (id, data) =>
    axiosInstance.put(`${BASE_CUSTOMERS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_CUSTOMERS}/${id}/`).then(r => r.data),
}

// ─── 2. CONSIGNORS ───────────────────────────────────────────────────────────

const BASE_CONSIGNORS = 'api/v1/consigners'

export const consignorsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_CONSIGNORS}/`, { params }).then(r => r.data),

  get: (customerId) =>
    axiosInstance.get(`${BASE_CONSIGNORS}/${customerId}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_CONSIGNORS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_CONSIGNORS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_CONSIGNORS}/${id}/`).then(r => r.data),
}

// ─── 3. CONSIGNEES ───────────────────────────────────────────────────────────

const BASE_CONSIGNEES = 'api/v1/consignees'

export const consigneesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_CONSIGNEES}/`, { params }).then(r => r.data),

  get: (customerId) =>
    axiosInstance.get(`${BASE_CONSIGNEES}/${customerId}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_CONSIGNEES}/`, data).then(r => r.data),
}

// ─── 4. BROKERS ──────────────────────────────────────────────────────────────

const BASE_BROKERS = 'api/v1/brokers'

export const brokersApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_BROKERS}/`, { params }).then(r => r.data),

  get: (customerId) =>
    axiosInstance.get(`${BASE_BROKERS}/${customerId}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_BROKERS}/`, data).then(r => r.data),
}