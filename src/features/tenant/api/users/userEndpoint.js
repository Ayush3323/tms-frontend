// src/features/tenant/api/users/userEndpoint.js
import axiosInstance from "../axiosInstance";

const BASE_URL = "/api/v1/users/users/";

/**
 * Standard utility to handle and safely throw API errors.
 */
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    const message = error.response.data?.message || error.response.data?.detail || "An error occurred on the server";
    console.error(`[API Error] ${error.config?.url}:`, message);
    throw new Error(message);
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`[Network Error] ${error.config?.url}: No response received`);
    throw new Error("No response received from server. Please check your network connection.");
  } else {
    // Something happened in setting up the request that triggered an Error
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

/**
 * Update user
 */
export const updateUser = async ({ id, data }) => {
  if (!id) throw new Error("User ID is required for updating");
  try {
    const response = await axiosInstance.patch(`${BASE_URL}${id}/`, data);
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