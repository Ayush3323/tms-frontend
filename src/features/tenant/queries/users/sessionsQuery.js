// src/features/tenant/queries/users/sessionsQuery.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessions, revokeSession } from "../../api/users/sessionsEndpoint";

/* ---------------- GET SESSIONS ---------------- */

export const useSessions = (params) =>
  useQuery({
    queryKey: ["sessions", params],
    queryFn: () => getSessions(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch sessions:", error.message);
    },
  });

/* ---------------- REVOKE SESSION ---------------- */

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => {
      const sessionId = typeof variables === "object" ? variables?.sessionId : variables;
      return revokeSession(sessionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      const userId = typeof variables === "object" ? variables?.userId : undefined;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userSessions", userId] });
      }
    },
    onError: (error) => {
      console.error("Failed to revoke session:", error.message);
    },
  });
};