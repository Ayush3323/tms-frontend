import axios from "axios";
import {refreshEndpoint} from "./loginEndpoint";

const axiosInstance = axios.create({
    baseURL: "http://192.168.1.36",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to attach access token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle token expiration and refresh
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 (Unauthorized) and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh_token");
                if (refreshToken) {
                    // Attempt to refresh the token
                    // We use axios directly to avoid infinite loop with the instance
                    const response = await refreshEndpoint({refresh: refreshToken});    

                    const { access } = response.data;

                    // Update local storage with new access token
                    localStorage.setItem("token", access);

                    // Update the original request header and retry
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, clear tokens and logout
                console.error("Refresh token failed:", refreshError);
                localStorage.removeItem("token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/admin/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;