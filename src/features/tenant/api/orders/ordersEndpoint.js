import axiosInstance from '../axiosInstance'

// ─── 1. PUBLIC / HEALTH ─────────────────────────────────────────────────────

export const orderServiceHealthApi = {
  check: () => 
    axiosInstance.get('health/').then(r => r.data),
}

// ─── 2. ORDERS (LR) ─────────────────────────────────────────────────────────

const BASE_ORDERS = 'api/v1/orders'

export const ordersApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_ORDERS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_ORDERS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_ORDERS}/`, data).then(r => r.data),

  // Supports both PUT and PATCH as per your requirements
  update: (id, data) =>
    axiosInstance.patch(`${BASE_ORDERS}/${id}/`, data).then(r => r.data),

  replace: (id, data) =>
    axiosInstance.put(`${BASE_ORDERS}/${id}/`, data).then(r => r.data),

  cancel: (id) =>
    axiosInstance.post(`${BASE_ORDERS}/${id}/cancel/`).then(r => r.data),

  assignTrip: (id, data) =>
    axiosInstance.post(`${BASE_ORDERS}/${id}/assign_trip/`, data).then(r => r.data),
}

// ─── 3. TRIPS ───────────────────────────────────────────────────────────────

const BASE_TRIPS = 'api/v1/trips'

export const tripsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_TRIPS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_TRIPS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_TRIPS}/`, data).then(r => r.data),

  // --- Sub-resources ---
  listStops: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/stops/`).then(r => r.data),
  createStop: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/stops/`, data).then(r => r.data),

  listStatusHistory: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/status-history/`).then(r => r.data),

  listDocuments: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/documents/`).then(r => r.data),
  createDocument: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/documents/`, data).then(r => r.data),

  listExpenses: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/expenses/`).then(r => r.data),
  createExpense: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/expenses/`, data).then(r => r.data),

  listCharges: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/charges/`).then(r => r.data),
  createCharge: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/charges/`, data).then(r => r.data),
}

// ─── 4. CARGO ──────────────────────────────────────────────────────────────

const BASE_CARGO = 'api/v1/cargo'

export const cargoApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_CARGO}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_CARGO}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_CARGO}/`, data).then(r => r.data),
}

// ─── 5. DELIVERIES (POD) ────────────────────────────────────────────────────

const BASE_DELIVERIES = 'api/v1/deliveries'

export const deliveriesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_DELIVERIES}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_DELIVERIES}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_DELIVERIES}/`, data).then(r => r.data),
}