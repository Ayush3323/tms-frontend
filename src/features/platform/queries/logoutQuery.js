import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

/**
 * Hook for logout mutation using TanStack Query.
 * Clears tokens from localStorage, clears Query cache, and redirects to login.
 */
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_REFRESH_KEY = "admin_refresh_token";

export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_REFRESH_KEY);
            return Promise.resolve();
        },
        onSuccess: () => {
            queryClient.clear();
            navigate("/admin/login", { replace: true });
        },
        onError: (error) => {
            console.error("Logout process failed:", error);
        },
    });
};
