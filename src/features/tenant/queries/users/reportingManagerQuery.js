// src/features/tenant/queries/users/reportingManagerQuery.js
import { useQuery } from "@tanstack/react-query";
import { getReportingManagers } from "../../api/users/reportingManagerEndpoint";

export const useReportingManagers = (params) =>
  useQuery({
    queryKey: ["reportingManagers", params],
    queryFn: () => getReportingManagers(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch reporting managers:", error.message);
    },
  });

