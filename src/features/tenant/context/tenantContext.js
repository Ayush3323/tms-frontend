import { API_BASE_URL } from "../../../config/apiConfig";

const TENANT_STORAGE_KEY = "resolved_tenant_context";
const TENANT_DOMAIN_OVERRIDE_KEY = "tenant_domain_override";
const RESOLVE_TIMEOUT_MS = 15000;

let tenantState = {
  status: "idle", // idle | loading | resolved | error
  data: null,
  error: null,
};

let inflightResolve = null;
const listeners = new Set();

// Small helper to avoid hanging requests during tenant resolve.
async function fetchWithTimeout(url, options = {}, timeoutMs = RESOLVE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function notify() {
  listeners.forEach((listener) => listener(tenantState));
}

function getHostName() {
  if (typeof window === "undefined") return "";
  return window.location.hostname || "";
}

function normalizeDomain(value) {
  return (value || "").trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
}

function getDomainFromQueryParam() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return normalizeDomain(params.get("tenant_domain"));
}

export function setTenantDomainOverride(domain) {
  if (typeof window === "undefined") return;
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    localStorage.removeItem(TENANT_DOMAIN_OVERRIDE_KEY);
    return;
  }
  localStorage.setItem(TENANT_DOMAIN_OVERRIDE_KEY, normalized);
}

export function getResolveDomain() {
  const host = normalizeDomain(getHostName());
  const queryOverride = getDomainFromQueryParam();
  if (queryOverride) {
    setTenantDomainOverride(queryOverride);
    return queryOverride;
  }

  if (typeof window === "undefined") return host;
  const storedOverride = normalizeDomain(localStorage.getItem(TENANT_DOMAIN_OVERRIDE_KEY));
  if (storedOverride) return storedOverride;

  if (host === "localhost" || host === "127.0.0.1") return "";
  return host;
}

function readCachedTenant() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TENANT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const expectedDomain = getResolveDomain();
    if (parsed?.resolved_domain !== expectedDomain) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cacheTenant(payload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(payload));
}

export function clearTenantContext() {
  tenantState = {
    status: "idle",
    data: null,
    error: null,
  };
  inflightResolve = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(TENANT_STORAGE_KEY);
  }
  notify();
}

export function getTenantContext() {
  return tenantState;
}

export function subscribeTenantContext(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function resolveTenantContext(force = false) {
  if (!force) {
    if (tenantState.status === "resolved" && tenantState.data?.id) return tenantState.data;
    const cached = readCachedTenant();
    if (cached?.id) {
      tenantState = { status: "resolved", data: cached, error: null };
      notify();
      return cached;
    }
    if (inflightResolve) return inflightResolve;
  }

  tenantState = { status: "loading", data: tenantState.data, error: null };
  notify();

  const resolvedDomain = getResolveDomain();
  if (!resolvedDomain) {
    const err = new Error("Unable to resolve tenant domain.");
    tenantState = { status: "error", data: null, error: err };
    notify();
    throw err;
  }

  const resolveUrl = `${API_BASE_URL}/api/v1/public/tenant/resolve/?domain=${encodeURIComponent(
    resolvedDomain
  )}`;

  inflightResolve = fetchWithTimeout(resolveUrl)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Tenant resolve failed with status ${res.status}`);
      }
      const payload = await res.json();
      const withDomain = { ...payload, resolved_domain: resolvedDomain };
      cacheTenant(withDomain);
      tenantState = { status: "resolved", data: withDomain, error: null };
      notify();
      return withDomain;
    })
    .catch((error) => {
      const err =
        error?.name === "AbortError"
          ? new Error(
              `Tenant resolve timed out after ${RESOLVE_TIMEOUT_MS / 1000}s. Is the API gateway reachable at ${API_BASE_URL}? Set VITE_API_BASE_URL if the gateway uses another host or port.`
            )
          : error;
      tenantState = { status: "error", data: null, error: err };
      notify();
      throw err;
    })
    .finally(() => {
      inflightResolve = null;
    });

  return inflightResolve;
}

export async function ensureTenantContext() {
  if (tenantState.status === "resolved" && tenantState.data?.id) {
    return tenantState.data;
  }
  return resolveTenantContext();
}

