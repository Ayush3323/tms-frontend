import axiosInstance from "./axiosInstance"

const BASE_URL = '/admin/api/v1/admins/';

// Helper to extract the best error message from the server response
const handleApiError = (error) => {
  // If the server sent a specific error message (e.g., from Django/Node)
  const message = error.response?.data?.message || 
                  error.response?.data?.detail || 
                  "An unexpected error occurred";
  throw new Error(message);
};

export const adminsApi = {
  list: async (page = 1) => {
    try {
      const { data } = await axiosInstance.get(BASE_URL, { params: { page } });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getDetails: async (id) => {
    try {
      const { data } = await axiosInstance.get(`${BASE_URL}${id}/`);
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  create: async (adminData) => {
    try {
      const { data } = await axiosInstance.post(BASE_URL, adminData);
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  update: async ({ id, ...payload }) => {
    try {
      const { data } = await axiosInstance.patch(`${BASE_URL}${id}/`, payload);
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}${id}/`);
      return id;
    } catch (error) {
      handleApiError(error);
    }
  },
};