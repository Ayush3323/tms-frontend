// src/features/tenant/queries/users/userQuery.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  getUserStats,
} from "../../api/users/userEndpoint";

/**
 * Get users list
 */
export const useUsers = (params) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 mins
    retry: 1, // Only retry once on failure
    onError: (error) => {
      console.error("Failed to fetch users:", error.message);
    },
  });
};

/**
 * Get user details
 */
export const useUser = (id) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch user with id ${id}:`, error.message);
    },
  });
};

/**
 * Create user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users-stats"] });
    },
    onError: (error) => {
      console.error("Failed to create user:", error.message);
    },
  });
};

/**
 * Update user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data, variables) => {
      // Invalidate the users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Invalidate the specific user query
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users-stats"] });
    },
    onError: (error) => {
      console.error("Failed to update user:", error.message);
    },
  });
};

/**
 * Delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users-stats"] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["user", id] });
      }
    },
    onError: (error) => {
      console.error("Failed to delete user:", error.message);
    },
  });
};

/**
 * Restore soft-deleted user
 */
export const useRestoreUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users-stats"] });
    },
    onError: (error) => {
      console.error("Failed to restore user:", error.message);
    },
  });
};

/**
 * Users stats
 */
export const useUserStats = () => {
  return useQuery({
    queryKey: ["users-stats"],
    queryFn: getUserStats,
    staleTime: 60 * 1000,
    retry: 1,
  });
};