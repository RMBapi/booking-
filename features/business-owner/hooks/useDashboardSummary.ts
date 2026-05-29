import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getDashboardSummary } from "@/services";
import type { ApiSuccessResponse, DashboardSummary, DashboardSummaryQuery } from "@/types";
import { getClientTimezone } from "../lib/analyticsHelpers";

export const useDashboardSummary = (
  businessId: string,
  options?: { enabled?: boolean; query?: Omit<DashboardSummaryQuery, "timezone"> },
) => {
  const timezone = getClientTimezone();
  const queryParams: DashboardSummaryQuery = {
    timezone,
    ...options?.query,
  };

  const { isLoading, data: response, error, refetch, isFetching } = useQuery<
    AxiosResponse<ApiSuccessResponse<DashboardSummary>>
  >({
    queryKey: ["dashboardSummary", businessId, queryParams],
    queryFn: () => getDashboardSummary(businessId, queryParams),
    enabled: !!businessId && (options?.enabled ?? true),
  });

  return {
    isLoading,
    isFetching,
    summary: response?.data?.data ?? null,
    error,
    refetch,
  };
};
