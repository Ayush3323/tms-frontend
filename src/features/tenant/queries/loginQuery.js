import { useMutation } from "@tanstack/react-query";
import { loginEndpoint } from "../api/loginEndpoint";

/**
 * Hook for login mutation using TanStack Query.
 * Uses the axiosInstance and login endpoint for authentication.
 */
export const useLogin = () => {
    return useMutation({
        mutationFn: loginEndpoint,
        onSuccess: (data) => {
            // Store both access and refresh tokens
            const accessToken = data?.access || data?.token;
            const refreshToken = data?.refresh;
            
            if (accessToken) {
                localStorage.setItem("token", accessToken);
            }
            if (refreshToken) {
                localStorage.setItem("refresh_token", refreshToken);
            }
        },
        onError: (error) => {
            // Handle error (e.g., show notification)
            console.error("Login Error:", error?.response?.data || error.message);
        },
    });
};    
