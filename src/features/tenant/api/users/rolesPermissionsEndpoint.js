// src/features/tenant/api/users/rolesPermissionsApi.js

import axiosInstance from "../axiosInstance";

const ROLES_BASE = "/api/v1/roles/roles/";
const ROLES_CREATE = "/api/v1/users/roles/";
const PERMISSIONS_BASE = "/api/v1/users/permissions/";

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

/* ---------------- ROLE APIs ---------------- */

export const getRoles = async (params = {}) => {
  try {
    const response = await axiosInstance.get(ROLES_BASE, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getRoleById = async (id) => {
  if (!id) throw new Error("Role ID is required");
  try {
    const response = await axiosInstance.get(`${ROLES_BASE}${id}/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getRolePermissions = async (id) => {
  if (!id) throw new Error("Role ID is required to fetch permissions");
  try {
    const response = await axiosInstance.get(`${ROLES_BASE}${id}/permissions/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createRole = async (data)=>{
  if(!data) throw new Error("Role data is required");
  try {
    const response = await axiosInstance.post(ROLES_CREATE, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export const assignPermission = async (id, data)=>{
  if(!id) throw new Error("Role ID is required");
  if(!data) throw new Error("Permission data is required");
  try {
    const response = await axiosInstance.post(`/api/v1/users/roles/${id}/assign-permissions/`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export const deleteRole = async (id)=>{
  if(!id) throw new Error("Role ID is required");
  try {
    const response = await axiosInstance.delete(`${ROLES_CREATE}${id}/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

/* ---------------- PERMISSION APIs ---------------- */

export const getPermissions = async (params = {}) => {
  try {
    const response = await axiosInstance.get(PERMISSIONS_BASE, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getPermissionById = async (id) => {
  if (!id) throw new Error("Permission ID is required");
  try {
    const response = await axiosInstance.get(`${PERMISSIONS_BASE}${id}/`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};