//domain endpoints

import axiosInstance from './axiosInstance';

const BASE = '/admin/api/v1/tenants';

// LIST
// params: { tenant, is_primary, search }
export const getDomains = (params) =>
axiosInstance.get(`${BASE}/domains/`, { params });

// CREATE
// data: { tenant (required), domain (required), is_primary }
export const createDomain = (data) =>
axiosInstance.post(`${BASE}/domains/`, data);

// UPDATE
// data: { is_primary }
export const updateDomain = (id, data) =>
axiosInstance.patch(`${BASE}/domains/${id}/`, data);

// DELETE
// Response: 204 No Content
export const deleteDomain = (id) =>
axiosInstance.delete(`${BASE}/domains/${id}/`);
