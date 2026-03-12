// src/features/tenant/api/users/userActionEndpoint.js

import axiosInstance from "../axiosInstance";

const BASE = "/api/v1/users/users/";

/* ---------------- ERROR HANDLER ---------------- */

const handleApiError = (error) => {
  if (error.response) {
    const message =
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

/* ---------------- USER ACTIONS ---------------- */

export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get(`${BASE}me/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const changePassword = async (payload) => {
  try {
    const response = await axiosInstance.post(`${BASE}change-password/`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const resetPassword = async (payload) => {
  try {
    const response = await axiosInstance.post(`${BASE}reset-password/`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const assignRoles = async ({ id, role_ids }) => {
  if (!id) throw new Error("User ID is required for role assignment");
  try {
    const response = await axiosInstance.post(`${BASE}${id}/assign-roles/`, {
      role_ids,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserPermissions = async (id) => {
  if (!id) throw new Error("User ID is required to fetch permissions");
  try {
    const response = await axiosInstance.get(`${BASE}${id}/permissions/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const lockUser = async ({ id, payload }) => {
  if (!id) throw new Error("User ID is required to lock user");
  try {
    const response = await axiosInstance.post(`${BASE}${id}/lock/`, payload);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const unlockUser = async (id) => {
  if (!id) throw new Error("User ID is required to unlock user");
  try {
    const response = await axiosInstance.post(`${BASE}${id}/unlock/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserSessions = async (id) => {
  if (!id) throw new Error("User ID is required to fetch sessions");
  try {
    const response = await axiosInstance.get(`${BASE}${id}/sessions/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserActivityLog = async ({ id, params }) => {
  if (!id) throw new Error("User ID is required to fetch activity log");
  try {
    const response = await axiosInstance.get(`${BASE}${id}/activity-log/`, {
      params,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};