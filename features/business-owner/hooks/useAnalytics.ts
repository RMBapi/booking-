import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import {
  getAnalyticsSummary,
  getAnalyticsTimeseries,
  getAnalyticsBreakdown,
} from "@/services";
import type {
  AnalyticsBreakdown,
  AnalyticsBreakdownQuery,
  AnalyticsRange,
  AnalyticsSummary,
  AnalyticsTimeseries,
  AnalyticsTimeseriesQuery,
  ApiSuccessResponse,
} from "@/types";
import { getClientTimezone, granularityForRange } from "../lib/analyticsHelpers";

export const useAnalyticsSummary = (
  businessId: string,
  range: AnalyticsRange,
  options?: { enabled?: boolean },
) => {
  const timezone = getClientTimezone();

  const { isLoading, data: response, error, refetch } = useQuery<
    AxiosResponse<ApiSuccessResponse<AnalyticsSummary>>
  >({
    queryKey: ["analyticsSummary", businessId, range, timezone],
    queryFn: () => getAnalyticsSummary(businessId, { range, timezone }),
    enabled: !!businessId && (options?.enabled ?? true),
  });

  return {
    isLoading,
    summary: response?.data?.data ?? null,
    error,
    refetch,
  };
};

export const useAnalyticsTimeseries = (
  businessId: string,
  params: {
    range: AnalyticsRange;
    metric: AnalyticsTimeseriesQuery["metric"];
    from?: string;
    to?: string;
  },
  options?: { enabled?: boolean },
) => {
  const timezone = getClientTimezone();
  const granularity = granularityForRange(params.range);

  const { isLoading, data: response, error, refetch } = useQuery<
    AxiosResponse<ApiSuccessResponse<AnalyticsTimeseries>>
  >({
    queryKey: [
      "analyticsTimeseries",
      businessId,
      params.metric,
      granularity,
      params.from,
      params.to,
      timezone,
    ],
    queryFn: () =>
      getAnalyticsTimeseries(businessId, {
        metric: params.metric,
        granularity,
        from: params.from!,
        to: params.to!,
        timezone,
      }),
    enabled:
      !!businessId &&
      !!params.from &&
      !!params.to &&
      (options?.enabled ?? true),
  });

  return {
    isLoading,
    timeseries: response?.data?.data ?? null,
    error,
    refetch,
  };
};

export const useAnalyticsBreakdown = (
  businessId: string,
  params: Omit<AnalyticsBreakdownQuery, "timezone">,
  options?: { enabled?: boolean },
) => {
  const timezone = getClientTimezone();

  const { isLoading, data: response, error, refetch } = useQuery<
    AxiosResponse<ApiSuccessResponse<AnalyticsBreakdown>>
  >({
    queryKey: ["analyticsBreakdown", businessId, params, timezone],
    queryFn: () =>
      getAnalyticsBreakdown(businessId, { ...params, timezone }),
    enabled: !!businessId && (options?.enabled ?? true),
  });

  return {
    isLoading,
    breakdown: response?.data?.data ?? null,
    error,
    refetch,
  };
};
