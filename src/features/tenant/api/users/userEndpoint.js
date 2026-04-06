// src/features/tenant/api/users/userEndpoint.js
import axiosInstance from "../axiosInstance";

const BASE_URL = "/api/v1/users/users/";

/**
 * Standard utility to handle and safely throw API errors.
 * Supports TMS shape: { error: { code, message, details } } and plain { message/detail }.
 */
const handleApiError = (error) => {
  if (error.response) {
    const data = error.response.data;
    if (error.response.status === 400) {
      throw data;
    }
    const message =
      data?.error?.message || data?.message || data?.detail || "An error occurred on the server";
    console.error(`[API Error] ${error.config?.url}:`, message);
    throw new Error(message);
  } else if (error.request) {
    console.error(`[Network Error] ${error.config?.url}: No response received`);
    throw new Error("No response received from server. Please check your network connection.");
  } else {
    console.error(`[Request Setup Error]:`, error.message);
    throw new Error(error.message || "An unexpected error occurred while setting up the request");
  }
};

/**
 * Get all users (with filters)
 */
export const getUsers = async (params = {}) => {
  try {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get single user details
 */
export const getUserById = async (id) => {
  if (!id) throw new Error("User ID is required");
  try {
    const response = await axiosInstance.get(`${BASE_URL}${id}/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create new user
 */
export const createUser = async (data) => {
  try {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/** Fields allowed by PATCH /api/v1/users/users/{id}/ (UserUpdateSerializer) */
const UPDATE_ALLOWED_FIELDS = [
  "email",
  "first_name", "middle_name", "last_name", "phone", "date_of_birth", "gender",
  "profile_picture_url", "account_type", "status", "reporting_manager",
  "is_staff", // Add this field to allow updates
  "is_verified",
  "employment",
  "employee_id", "department", "job_title", "joining_date", "leaving_date", "employment_status",
];

/** Normalize date string to YYYY-MM-DD for the API (backend expects this format). */
function toISODate(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Update user. Sends only allowed fields so nested/read-only data from GET are never sent.
 * date_of_birth is normalized to YYYY-MM-DD for the API.
 */
export const updateUser = async ({ id, data }) => {
  if (!id) throw new Error("User ID is required for updating");
  const payload = {};
  UPDATE_ALLOWED_FIELDS.forEach((key) => {
    if (data[key] !== undefined) {
      let value = data[key] === "" ? null : data[key];
      if (key === "date_of_birth" && value != null) {
        value = toISODate(value);
      }
      payload[key] = value;
    }
  });
  const employmentFieldMap = {
    employee_id: "employee_id",
    department: "department",
    job_title: "job_title",
    joining_date: "joining_date",
    leaving_date: "leaving_date",
    employment_status: "employment_status",
  };
  const flatEmploymentPayload = Object.entries(employmentFieldMap).reduce((acc, [flatKey, nestedKey]) => {
    if (data[flatKey] !== undefined) {
      acc[nestedKey] = data[flatKey] === "" ? null : data[flatKey];
    }
    return acc;
  }, {});
  if (Object.keys(flatEmploymentPayload).length > 0) {
    payload.employment = {
      ...(payload.employment || {}),
      ...flatEmploymentPayload,
    };
  }
  try {
    const response = await axiosInstance.patch(`${BASE_URL}${id}/`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id) => {
  if (!id) throw new Error("User ID is required for deletion");
  try {
    const response = await axiosInstance.delete(`${BASE_URL}${id}/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Restore soft-deleted user
 */
export const restoreUser = async (id) => {
  if (!id) throw new Error("User ID is required for restore");
  try {
    const response = await axiosInstance.post(`${BASE_URL}${id}/restore/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get users dashboard stats
 */
export const getUserStats = async () => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}stats/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};