import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import {
  advanceApi,
  customerPaymentApi,
  financeReportApi,
  invoiceApi,
  ownerPaymentApi,
  payrollApi,
  reconciliationApi,
  tripLookupApi,
  tdsApi,
} from '../../api/finance/financeEndpoint'

export const financeKeys = {
  invoices: (params) => ['finance', 'invoices', params],
  customerPayments: (params) => ['finance', 'customerPayments', params],
  ownerPayments: (params) => ['finance', 'ownerPayments', params],
  payrollPeriods: (params) => ['finance', 'payrollPeriods', params],
  payrollEntries: (params) => ['finance', 'payrollEntries', params],
  tdsEntries: (params) => ['finance', 'tdsEntries', params],
  tdsReturns: (params) => ['finance', 'tdsReturns', params],
  advances: (params) => ['finance', 'advances', params],
  reports: (name, params) => ['finance', 'reports', name, params],
  tripsLookup: (params) => ['finance', 'tripsLookup', params],
}

const onErr = (label) => (error) => {
  const msg = error?.response?.data?.detail || error?.response?.data?.message || error.message || 'Request failed'
  toast.error(`${label}: ${msg}`)
}

export const useInvoices = (params) => useQuery({ queryKey: financeKeys.invoices(params), queryFn: () => invoiceApi.list(params) })
export const useCustomerPayments = (params) => useQuery({ queryKey: financeKeys.customerPayments(params), queryFn: () => customerPaymentApi.list(params) })
export const useOwnerPayments = (params) => useQuery({ queryKey: financeKeys.ownerPayments(params), queryFn: () => ownerPaymentApi.list(params) })
export const usePayrollPeriods = (params) => useQuery({ queryKey: financeKeys.payrollPeriods(params), queryFn: () => payrollApi.listPeriods(params) })
export const usePayrollEntries = (params) => useQuery({ queryKey: financeKeys.payrollEntries(params), queryFn: () => payrollApi.listEntries(params) })
export const useTDSEntries = (params) => useQuery({ queryKey: financeKeys.tdsEntries(params), queryFn: () => tdsApi.listEntries(params) })
export const useTDSReturns = (params) => useQuery({ queryKey: financeKeys.tdsReturns(params), queryFn: () => tdsApi.listReturns(params) })
export const useAdvances = (params) => useQuery({ queryKey: financeKeys.advances(params), queryFn: () => advanceApi.list(params) })
export const useTripsLookup = (params) =>
  useQuery({ queryKey: financeKeys.tripsLookup(params), queryFn: () => tripLookupApi.list(params) })
export const useARAgingReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('arAging', params), queryFn: () => financeReportApi.arAging(params) })
export const useOwnerPayablesReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('ownerPayables', params), queryFn: () => financeReportApi.ownerPayables(params) })
export const useTripProfitabilityReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('tripProfitability', params), queryFn: () => financeReportApi.tripProfitability(params) })
export const useTDSRegisterReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('tdsRegister', params), queryFn: () => financeReportApi.tdsRegister(params) })
export const useAdvanceDetail = (id) => useQuery({
  queryKey: ['finance', 'advanceDetail', id],
  queryFn: () => advanceApi.get(id),
  enabled: !!id,
})

export const usePostInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.post,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Invoice posted')
    },
    onError: onErr('Could not post invoice'),
  })
}
export const useCancelInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Invoice cancelled')
    },
    onError: onErr('Could not cancel invoice'),
  })
}
export const useMarkInvoiceOverdue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.markOverdue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Invoice marked overdue')
    },
    onError: onErr('Could not mark overdue'),
  })
}
export const useGenerateInvoiceFromTrip = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.generateFromTrip,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Invoice generated from trip')
    },
    onError: onErr('Could not generate invoice'),
  })
}
export const useVerifyCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.verify,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      toast.success('Customer payment verified')
    },
    onError: onErr('Verification failed'),
  })
}
export const useBounceCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.bounce,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      toast.success('Payment marked bounced')
    },
    onError: onErr('Bounce failed'),
  })
}
export const useAutoReconcilePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.autoReconcile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Payment auto-reconciled')
    },
    onError: onErr('Auto-reconcile failed'),
  })
}
export const useApproveOwnerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ownerPaymentApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      toast.success('Owner payment approved')
    },
    onError: onErr('Approval failed'),
  })
}
export const useMarkOwnerPaymentPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ownerPaymentApi.markPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      toast.success('Owner payment marked paid')
    },
    onError: onErr('Mark paid failed'),
  })
}
export const useReconcilePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reconciliationApi.reconcile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Payment reconciled')
    },
    onError: onErr('Reconciliation failed'),
  })
}
export const useGeneratePayrollEntries = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.generateEntries,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entries generated')
    },
    onError: onErr('Generation failed'),
  })
}
export const useClosePayrollPeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.closePeriod,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      toast.success('Payroll period closed')
    },
    onError: onErr('Could not close period'),
  })
}
export const useMarkAllPayrollPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.markAllPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('All payroll entries marked paid')
    },
    onError: onErr('Could not mark all paid'),
  })
}
export const useMarkPayrollEntryPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.markEntryPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entry marked paid')
    },
    onError: onErr('Could not mark entry paid'),
  })
}
export const useIssueTDSCertificate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tds_certificate_number }) => tdsApi.issueCertificate(id, tds_certificate_number),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('Certificate issued')
    },
    onError: onErr('Could not issue certificate'),
  })
}
export const useFileTDSReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.fileReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('Quarterly return filed')
    },
    onError: onErr('Filing failed'),
  })
}
export const useMarkTDSEntryPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.markEntryPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('TDS entry marked paid')
    },
    onError: onErr('Could not mark TDS entry paid'),
  })
}
export const useMarkTDSReturnPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.markReturnPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('TDS return marked paid')
    },
    onError: onErr('Could not mark TDS return paid'),
  })
}
export const useApproveAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance approved')
    },
    onError: onErr('Advance approval failed'),
  })
}
export const useRejectAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rejection_reason }) => advanceApi.reject(id, rejection_reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance rejected')
    },
    onError: onErr('Advance rejection failed'),
  })
}
export const useDisburseAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.disburse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance disbursed')
    },
    onError: onErr('Disbursement failed'),
  })
}
export const useSettleAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => advanceApi.settle(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance settled')
    },
    onError: onErr('Advance settle failed'),
  })
}
