import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

/**
 * Hook for logout mutation using TanStack Query.
 * Clears tokens from localStorage, clears Query cache, and redirects to login.
 */
export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async () => {
            // Optional: call a logout API endpoint if it exists
            // await axiosInstance.post('/admin/api/v1/logout/');

            // Clear authentication tokens from localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            
            // Artificial delay to simulate real logout if needed, 
            // but usually logout is immediate unless there's an API call.
            return Promise.resolve();
        },
        onSuccess: () => {
            // Reset the query client to clear any cached user data
            queryClient.clear();
            
            // Direct navigation to the login page
            // Using replace: true prevents going back to dashboard with back button
            navigate("/tenant/login", { replace: true });
        },
        onError: (error) => {
            // Log logout errors
            console.error("Logout process failed:", error);
        },
    });
};
