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

  // ── Sub-resources ────────────────────────────────────────────────────────
  addresses: {
    list: (customerId) => axiosInstance.get(`${BASE_CUSTOMERS}/${customerId}/addresses/`).then(r => r.data),
    create: (customerId, data) => axiosInstance.post(`${BASE_CUSTOMERS}/${customerId}/addresses/`, data).then(r => r.data),
    update: (customerId, addrId, data) => axiosInstance.patch(`${BASE_CUSTOMERS}/${customerId}/addresses/${addrId}/`, data).then(r => r.data),
    delete: (customerId, addrId) => axiosInstance.delete(`${BASE_CUSTOMERS}/${customerId}/addresses/${addrId}/`).then(r => r.data),
  },
  contacts: {
    list: (customerId) => axiosInstance.get(`${BASE_CUSTOMERS}/${customerId}/contacts/`).then(r => r.data),
    create: (customerId, data) => axiosInstance.post(`${BASE_CUSTOMERS}/${customerId}/contacts/`, data).then(r => r.data),
    update: (customerId, contactId, data) => axiosInstance.patch(`${BASE_CUSTOMERS}/${customerId}/contacts/${contactId}/`, data).then(r => r.data),
    delete: (customerId, contactId) => axiosInstance.delete(`${BASE_CUSTOMERS}/${customerId}/contacts/${contactId}/`).then(r => r.data),
  },
  documents: {
    list: (customerId) => axiosInstance.get(`${BASE_CUSTOMERS}/${customerId}/documents/`).then(r => r.data),
    create: (customerId, data) => axiosInstance.post(`${BASE_CUSTOMERS}/${customerId}/documents/`, data).then(r => r.data),
    update: (customerId, docId, data) => axiosInstance.patch(`${BASE_CUSTOMERS}/${customerId}/documents/${docId}/`, data).then(r => r.data),
    delete: (customerId, docId) => axiosInstance.delete(`${BASE_CUSTOMERS}/${customerId}/documents/${docId}/`).then(r => r.data),
  },
  contracts: {
    list: (customerId) => axiosInstance.get(`${BASE_CUSTOMERS}/${customerId}/contracts/`).then(r => r.data),
    create: (customerId, data) => axiosInstance.post(`${BASE_CUSTOMERS}/${customerId}/contracts/`, data).then(r => r.data),
    update: (customerId, contractId, data) => axiosInstance.patch(`${BASE_CUSTOMERS}/${customerId}/contracts/${contractId}/`, data).then(r => r.data),
    delete: (customerId, contractId) => axiosInstance.delete(`${BASE_CUSTOMERS}/${customerId}/contracts/${contractId}/`).then(r => r.data),
    rates: {
      list: (contractId) => axiosInstance.get(`api/v1/contracts/${contractId}/rates/`).then(r => r.data),
      create: (contractId, data) => axiosInstance.post(`api/v1/contracts/${contractId}/rates/`, data).then(r => r.data),
      update: (contractId, rateId, data) => axiosInstance.patch(`api/v1/contracts/${contractId}/rates/${rateId}/`, data).then(r => r.data),
      delete: (contractId, rateId) => axiosInstance.delete(`api/v1/contracts/${contractId}/rates/${rateId}/`).then(r => r.data),
    }
  },
  creditHistory: (customerId) =>
    axiosInstance.get(`${BASE_CUSTOMERS}/${customerId}/credit-history/`).then(r => r.data),
  notes: {
    list: (customerId) => axiosInstance.get(`${BASE_CUSTOMERS}/${customerId}/notes/`).then(r => r.data),
    create: (customerId, data) => axiosInstance.post(`${BASE_CUSTOMERS}/${customerId}/notes/`, data).then(r => r.data),
  }
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

  update: (id, data) =>
    axiosInstance.patch(`${BASE_CONSIGNEES}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_CONSIGNEES}/${id}/`).then(r => r.data),
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

  update: (id, data) =>
    axiosInstance.patch(`${BASE_BROKERS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_BROKERS}/${id}/`).then(r => r.data),
}

// ─── 5. AGENTS ───────────────────────────────────────────────────────────────

const BASE_AGENTS = 'api/v1/agents'

export const agentsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_AGENTS}/`, { params }).then(r => r.data),

  get: (customerId) =>
    axiosInstance.get(`${BASE_AGENTS}/${customerId}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_AGENTS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_AGENTS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_AGENTS}/${id}/`).then(r => r.data),
}