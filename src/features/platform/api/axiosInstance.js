import axios from "axios";
import {refreshEndpoint} from "./loginEndpoint";

const axiosInstance = axios.create({
    baseURL: "http://192.168.1.34",
    headers: {
        "Content-Type": "application/json",
    },
});

const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_REFRESH_KEY = "admin_refresh_token";

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem(ADMIN_REFRESH_KEY);
                if (refreshToken) {
                    const response = await refreshEndpoint({ refresh: refreshToken });
                    const access = response?.access || response?.data?.access;

                    localStorage.setItem(ADMIN_TOKEN_KEY, access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                console.error("Refresh token failed:", refreshError);
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                localStorage.removeItem(ADMIN_REFRESH_KEY);
                window.location.href = "/admin/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;