// src/features/tenant/queries/users/activitiesQuery.js

import { useQuery } from "@tanstack/react-query";
import { getActivities } from "../../api/users/activitiesEndpoint";

/* ---------------- GET ACTIVITIES ---------------- */

export const useActivities = (params) =>
  useQuery({
    queryKey: ["activities", params],
    queryFn: () => getActivities(params),
    staleTime: 5 * 60 * 1000, // 5 minutes caching
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch activities:", error.message);
    },
  });