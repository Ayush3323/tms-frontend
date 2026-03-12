// src/features/tenant/queries/users/rolesPermissionsQueries.js

import { useQuery } from "@tanstack/react-query";

import {
  getRoles,
  getRoleById,
  getRolePermissions,
  getPermissions,
  getPermissionById,
} from "../../api/users/rolesPermissionsEndpoint";

/* ---------------- ROLES ---------------- */

export const useRoles = (params) =>
  useQuery({
    queryKey: ["roles", params],
    queryFn: () => getRoles(params),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 1, // 1 retry on failure
    onError: (error) => {
      console.error("Failed to fetch roles:", error.message);
    },
  });

export const useRole = (id) =>
  useQuery({
    queryKey: ["role", id],
    queryFn: () => getRoleById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch role with id ${id}:`, error.message);
    },
  });

export const useRolePermissions = (id) =>
  useQuery({
    queryKey: ["rolePermissions", id],
    queryFn: () => getRolePermissions(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch role permissions for id ${id}:`, error.message);
    },
  });

/* ---------------- PERMISSIONS ---------------- */

export const usePermissions = (params) =>
  useQuery({
    queryKey: ["permissions", params],
    queryFn: () => getPermissions(params),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch permissions:", error.message);
    },
  });

export const usePermission = (id) =>
  useQuery({
    queryKey: ["permission", id],
    queryFn: () => getPermissionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error(`Failed to fetch permission with id ${id}:`, error.message);
    },
  });