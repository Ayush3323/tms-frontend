// src/features/tenant/queries/users/userActionQuery.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getCurrentUser,
  changePassword,
  resetPassword,
  assignRoles,
  getUserPermissions,
  lockUser,
  unlockUser,
  getUserSessions,
  getUserActivityLog,
  userRoles,
  removeUserRole
} from "../../api/users/userActionEndpoint";


/* -------------- Get me ---------------------*/

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    onSuccess: (data) => {
      console.log("Current user fetched successfully:", data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch current user:", error.message);
    },
  });

/* ---------------- PASSWORD ---------------- */

export const useChangePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error) => {
      console.error("Failed to change password:", error.message);
    },
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (error) => {
      console.error("Failed to reset password:", error.message);
    },
  });
};
/* ---------------- ROLES ---------------- */

export const useAssignRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRoles,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userPermissions", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["userRoles", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Failed to assign roles:", error.message);
    },
  });
};

export const useUserRoles = (id) =>
  useQuery({
    queryKey: ["userRoles", id],
    queryFn: () => userRoles(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch user roles for id ${id}:`, error.message);
    },
  });

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeUserRole,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userRoles", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["userPermissions", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
    onError: (error) => {
      console.error("Failed to remove user role:", error.message);
    },
  });
};

/* ---------------- PERMISSIONS ---------------- */

export const useUserPermissions = (id) =>
  useQuery({
    queryKey: ["userPermissions", id],
    queryFn: () => getUserPermissions(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch user permissions for id ${id}:`, error.message);
    },
  });

/* ---------------- ACCOUNT LOCK ---------------- */

export const useLockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lockUser,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users-stats"] });
    },
    onError: (error) => {
      console.error("Failed to lock user:", error.message);
    },
  });
};

export const useUnlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlockUser,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users-stats"] });
    },
    onError: (error) => {
      console.error("Failed to unlock user:", error.message);
    },
  });
};

/* ---------------- SESSIONS ---------------- */

export const useUserSessions = (id) =>
  useQuery({
    queryKey: ["userSessions", id],
    queryFn: () => getUserSessions(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch user sessions for id ${id}:`, error.message);
    },
  });

/* ---------------- ACTIVITY LOG ---------------- */

export const useUserActivityLog = (id, params) =>
  useQuery({
    queryKey: ["userActivity", id, params],
    queryFn: () => getUserActivityLog({ id, params }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch user activity log for id ${id}:`, error.message);
    },
  });