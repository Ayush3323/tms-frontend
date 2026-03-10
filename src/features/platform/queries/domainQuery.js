import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
} from '../api/domainEndpoint';

/* ─── Query Keys ──────────────────────────────────────────────────────────── */
export const DOMAIN_KEYS = {
  all   : ['domains'],
  lists : ()  => [...DOMAIN_KEYS.all, 'list'],
  list  : (p) => [...DOMAIN_KEYS.lists(), p],
};

/* ─── Error Helper ────────────────────────────────────────────────────────── */
/**
 * API error se readable message nikalta hai
 *
 * Possible errors:
 *   400 → Validation error  (field galat bhara)
 *   401 → Unauthorized      (token nahi / expire)
 *   403 → Forbidden         (permission nahi)
 *   404 → Not Found         (domain exist nahi)
 *   409 → Conflict          (domain already exist)
 *   500 → Server Error      (backend problem)
 */
export const getDomainErrorMessage = (error) => {
  if (!error) return 'Something went wrong.';

  const status = error?.response?.status;
  const detail = error?.response?.data?.error?.message
    || error?.response?.data?.detail
    || error?.response?.data?.domain?.[0]   // field-level error
    || error?.response?.data?.tenant?.[0]   // field-level error
    || error?.message;

  switch (status) {
    case 400:
      return `Validation Error: ${detail || 'Please check the form fields.'}`;
    case 401:
      return 'Session expired. Please login again.';
    case 403:
      return 'Permission denied. You are not allowed to do this.';
    case 404:
      return 'Domain not found. It may have been deleted.';
    case 409:
      return `Conflict: ${detail || 'This domain already exists.'}`;
    case 500:
      return 'Server error. Please try again later.';
    default:
      return detail || 'Something went wrong. Please try again.';
  }
};

/* ─── Query ───────────────────────────────────────────────────────────────── */

/**
 * Fetch domain list with optional filters.
 * params: { tenant, is_primary, search }
 *
 * Usage:
 *   useDomainsQuery({})                 → saare domains
 *   useDomainsQuery({ tenant: "uuid" }) → ek tenant ke domains
 *   useDomainsQuery({ search: "abc" })  → search
 *
 * Returns:
 *   data        → { count, results }
 *   isLoading   → pehli baar load
 *   isFetching  → background refresh
 *   isError     → kuch galat hua
 *   errorMessage→ readable error text
 */
export const useDomainsQuery = (params) => {
  const query = useQuery({
    queryKey        : DOMAIN_KEYS.list(params),
    queryFn         : () => getDomains(params).then((r) => r.data),
    keepPreviousData: true,
    staleTime       : 15_000,
    retry           : (failureCount, error) => {
      // 401, 403 pe retry mat karo — token problem hai
      const status = error?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2; // baaki pe 2 baar retry
    },
  });

  return {
    ...query,
    // readable error message bhi saath mein do
    errorMessage: query.isError
      ? getDomainErrorMessage(query.error)
      : null,
  };
};

/* ─── Mutations ───────────────────────────────────────────────────────────── */

/**
 * Create a new domain.
 * mutate({ tenant, domain, is_primary })
 * → POST /domains/
 * onSuccess → list refresh
 *
 * Usage:
 *   const { mutate, isPending, isError, error } = useCreateDomainMutation();
 *   mutate({ tenant: "uuid", domain: "abc.tms.app", is_primary: true });
 *
 *   Error dikhana:
 *   getDomainErrorMessage(error) → readable message
 */
export const useCreateDomainMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn : createDomain,
    onSuccess  : () => {
      qc.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
    onError: (error) => {
      // Console mein detail log karo debugging ke liye
      console.error(
        '[Domain Create Error]',
        error?.response?.status,
        error?.response?.data
      );
    },
  });
};

/**
 * Update a domain (PATCH).
 * mutate({ id, data: { is_primary } })
 * → PATCH /domains/{id}/
 * onSuccess → list refresh
 */
export const useUpdateDomainMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn : ({ id, data }) => updateDomain(id, data),
    onSuccess  : () => {
      qc.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
    onError: (error) => {
      console.error(
        '[Domain Update Error]',
        error?.response?.status,
        error?.response?.data
      );
    },
  });
};

/**
 * Delete a domain.
 * mutate(id)
 * → DELETE /domains/{id}/
 * Response: 204 No Content
 * onSuccess → list refresh
 */
export const useDeleteDomainMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn : deleteDomain,
    onSuccess  : () => {
      qc.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
    onError: (error) => {
      console.error(
        '[Domain Delete Error]',
        error?.response?.status,
        error?.response?.data
      );
    },
  });
};