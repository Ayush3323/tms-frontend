import { useMutation } from "@tanstack/react-query";
import { loginEndpoint } from "../api/loginEndpoint";

/**
 * Hook for login mutation using TanStack Query.
 * Uses the axiosInstance and login endpoint for authentication.
 */
export const useLogin = () => {
    return useMutation({
        mutationFn: loginEndpoint,
        onSuccess: (data, variables) => {
            // Store both access and refresh tokens
            const accessToken = data?.access || data?.token;
            const refreshToken = data?.refresh;

            const rememberMe = Boolean(variables?.rememberMe);
            // Store storage preference in localStorage so refresh can keep using the same choice.
            localStorage.setItem("auth_storage", rememberMe ? "local" : "session");

            const storage = rememberMe ? localStorage : sessionStorage;
            if (accessToken) storage.setItem("token", accessToken);
            if (refreshToken) storage.setItem("refresh_token", refreshToken);

            // Remember email only (never store password)
            const email = variables?.email;
            if (rememberMe && email) localStorage.setItem("remembered_email", email);
            if (!rememberMe) localStorage.removeItem("remembered_email");
        },
        onError: (error) => {
            // Handle error (e.g., show notification)
            console.error("Login Error:", error?.response?.data || error.message);
        },
    });
};    
