// src/features/tenant/api/users/reportingManagerEndpoint.js
import axiosInstance from "../axiosInstance";

const BASE_URL = "/api/v1/users/users/reporting-managers/";

const handleApiError = (error) => {
  if (error.response) {
    const data = error.response.data;
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
 * Fetch eligible reporting managers.
 * Default role_code on backend is FLEET_MANAGER.
 */
export const getReportingManagers = async (params = {}) => {
  try {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

