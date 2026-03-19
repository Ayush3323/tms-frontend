import { useMutation } from "@tanstack/react-query";
import { loginEndpoint } from "../api/loginEndpoint";

/**
 * Hook for login mutation using TanStack Query.
 * Uses the axiosInstance and login endpoint for authentication.
 */
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_REFRESH_KEY = "admin_refresh_token";

export const useLogin = () => {
    return useMutation({
        mutationFn: loginEndpoint,
        onSuccess: (data) => {
            const accessToken = data?.access || data?.token;
            const refreshToken = data?.refresh;

            if (accessToken) {
                localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
            }
            if (refreshToken) {
                localStorage.setItem(ADMIN_REFRESH_KEY, refreshToken);
            }
        },
        onError: (error) => {
            console.error("Login Error:", error?.response?.data || error.message);
        },
    });
};    
