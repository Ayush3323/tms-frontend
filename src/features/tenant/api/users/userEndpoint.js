// src/api/userApi.js
import axiosInstance from "../axiosInstance";

const BASE_URL = "/api/v1/users/users/";

/**
 * Get all users (with filters)
 */
export const getUsers = async (params = {}) => {
  const response = await axiosInstance.get(BASE_URL, {
    params,
  });
  return response.data;
};

/**
 * Get single user details
 */
export const getUserById = async (id) => {
  const response = await axiosInstance.get(`${BASE_URL}${id}/`);
  return response.data;
};

/**
 * Create new user
 */
export const createUser = async (data) => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async ({ id, data }) => {
  const response = await axiosInstance.patch(`${BASE_URL}${id}/`, data);
  return response.data;
};

/**
 * Delete user
 */
export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`${BASE_URL}${id}/`);
  return response.data;
};