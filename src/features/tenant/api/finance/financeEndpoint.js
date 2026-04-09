import axiosInstance from '../axiosInstance'

const INV_BASE = 'api/v1/finance/invoices'
const PAY_BASE = 'api/v1/finance/payments'
const PRL_BASE = 'api/v1/finance/payroll'
const TDS_BASE = 'api/v1/finance/tds'
const ADV_BASE = 'api/v1/finance/advances'
const REP_BASE = 'api/v1/finance/reports'

export const invoiceApi = {
  list: (params) => axiosInstance.get(`${INV_BASE}/invoices/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${INV_BASE}/invoices/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${INV_BASE}/invoices/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${INV_BASE}/invoices/${id}/`, data).then(r => r.data),
  post: (id) => axiosInstance.post(`${INV_BASE}/invoices/${id}/post-invoice/`).then(r => r.data),
  cancel: (id) => axiosInstance.post(`${INV_BASE}/invoices/${id}/cancel/`).then(r => r.data),
  generateFromTrip: (tripId) => axiosInstance.post(`${INV_BASE}/invoices/generate-from-trip/`, { trip_id: tripId }).then(r => r.data),
}

export const creditNoteApi = {
  list: (params) => axiosInstance.get(`${INV_BASE}/credit-notes/`, { params }).then(r => r.data),
  create: (data) => axiosInstance.post(`${INV_BASE}/credit-notes/`, data).then(r => r.data),
}

export const customerPaymentApi = {
  list: (params) => axiosInstance.get(`${PAY_BASE}/customer-payments/`, { params }).then(r => r.data),
  create: (data) => axiosInstance.post(`${PAY_BASE}/customer-payments/`, data).then(r => r.data),
  verify: (id) => axiosInstance.post(`${PAY_BASE}/customer-payments/${id}/verify/`).then(r => r.data),
  bounce: (id) => axiosInstance.post(`${PAY_BASE}/customer-payments/${id}/bounce/`).then(r => r.data),
}

export const ownerPaymentApi = {
  list: (params) => axiosInstance.get(`${PAY_BASE}/owner-payments/`, { params }).then(r => r.data),
  create: (data) => axiosInstance.post(`${PAY_BASE}/owner-payments/`, data).then(r => r.data),
  approve: (id) => axiosInstance.post(`${PAY_BASE}/owner-payments/${id}/approve/`).then(r => r.data),
  markPaid: (id) => axiosInstance.post(`${PAY_BASE}/owner-payments/${id}/mark-paid/`).then(r => r.data),
}

export const reconciliationApi = {
  list: (params) => axiosInstance.get(`${PAY_BASE}/reconciliations/`, { params }).then(r => r.data),
  reconcile: (data) => axiosInstance.post(`${PAY_BASE}/reconciliations/reconcile/`, data).then(r => r.data),
}

export const payrollApi = {
  listPeriods: (params) => axiosInstance.get(`${PRL_BASE}/periods/`, { params }).then(r => r.data),
  listEntries: (params) => axiosInstance.get(`${PRL_BASE}/entries/`, { params }).then(r => r.data),
  createPeriod: (data) => axiosInstance.post(`${PRL_BASE}/periods/`, data).then(r => r.data),
  generateEntries: (id) => axiosInstance.post(`${PRL_BASE}/periods/${id}/generate-entries/`).then(r => r.data),
  closePeriod: (id) => axiosInstance.post(`${PRL_BASE}/periods/${id}/close-period/`).then(r => r.data),
  markEntryPaid: (id) => axiosInstance.post(`${PRL_BASE}/entries/${id}/mark-paid/`).then(r => r.data),
}

export const tdsApi = {
  listEntries: (params) => axiosInstance.get(`${TDS_BASE}/entries/`, { params }).then(r => r.data),
  listReturns: (params) => axiosInstance.get(`${TDS_BASE}/quarterly-returns/`, { params }).then(r => r.data),
  issueCertificate: (id, tds_certificate_number) =>
    axiosInstance.post(`${TDS_BASE}/entries/${id}/issue-certificate/`, { tds_certificate_number }).then(r => r.data),
  fileReturn: (data) => axiosInstance.post(`${TDS_BASE}/quarterly-returns/file-return/`, data).then(r => r.data),
}

export const advanceApi = {
  list: (params) => axiosInstance.get(`${ADV_BASE}/requests/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${ADV_BASE}/requests/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${ADV_BASE}/requests/`, data).then(r => r.data),
  approve: (id) => axiosInstance.post(`${ADV_BASE}/requests/${id}/approve/`).then(r => r.data),
  reject: (id, rejection_reason) => axiosInstance.post(`${ADV_BASE}/requests/${id}/reject/`, { rejection_reason }).then(r => r.data),
  disburse: (id) => axiosInstance.post(`${ADV_BASE}/requests/${id}/disburse/`).then(r => r.data),
}

export const financeReportApi = {
  arAging: (params) => axiosInstance.get(`${REP_BASE}/ar-aging/`, { params }).then(r => r.data),
  ownerPayables: (params) => axiosInstance.get(`${REP_BASE}/owner-payables/`, { params }).then(r => r.data),
  tripProfitability: (params) => axiosInstance.get(`${REP_BASE}/trip-profitability/`, { params }).then(r => r.data),
  tdsRegister: (params) => axiosInstance.get(`${REP_BASE}/tds-register/`, { params }).then(r => r.data),
}
