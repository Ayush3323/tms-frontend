import { API_BASE_URL } from "../../../config/apiConfig";

const TENANT_STORAGE_KEY = "resolved_tenant_context";
const TENANT_DOMAIN_OVERRIDE_KEY = "tenant_domain_override";

let tenantState = {
  status: "idle", // idle | loading | resolved | error
  data: null,
  error: null,
};

let inflightResolve = null;
const listeners = new Set();

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

  inflightResolve = fetch(
    `${API_BASE_URL}/api/v1/public/tenant/resolve/?domain=${encodeURIComponent(
      resolvedDomain
    )}`
  )
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
      tenantState = { status: "error", data: null, error };
      notify();
      throw error;
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

