const DEFAULT_API_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}`
    : "http://localhost";

const envBase =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL != null
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : "";

/** API gateway base (no trailing slash). Set VITE_API_BASE_URL when the gateway is not on the default host port (e.g. http://192.168.1.34:8080). */
export const API_BASE_URL = envBase || DEFAULT_API_BASE_URL;

