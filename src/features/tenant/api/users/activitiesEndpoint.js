// src/features/tenant/api/users/activitiesEndpoint.js

import axiosInstance from "../axiosInstance";

const BASE = "/api/v1/users/activities/";

/* ---------------- ERROR HANDLER ---------------- */

const handleApiError = (error) => {
  if (error.response) {
    const err = error.response.data?.error;
    const message =
      err?.message ||
      error.response.data?.message ||
      error.response.data?.detail ||
      "An error occurred on the server";
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

/* ---------------- GET ACTIVITIES ---------------- */

export const getActivities = async (params = {}) => {
  try {
    const response = await axiosInstance.get(BASE, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};