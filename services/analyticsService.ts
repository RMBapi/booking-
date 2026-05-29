import { http } from "@/lib";
import type {
  AnalyticsBreakdown,
  AnalyticsBreakdownQuery,
  AnalyticsSummary,
  AnalyticsSummaryQuery,
  AnalyticsTimeseries,
  AnalyticsTimeseriesQuery,
} from "@/types";

const businessHeaders = (businessId: string) => ({
  "x-business-id": businessId,
});

export const getAnalyticsSummary = async (
  businessId: string,
  params: AnalyticsSummaryQuery,
) => {
  return http.get("/analytics/summary", {
    params,
    headers: businessHeaders(businessId),
  });
};

export const getAnalyticsTimeseries = async (
  businessId: string,
  params: AnalyticsTimeseriesQuery,
) => {
  return http.get("/analytics/timeseries", {
    params,
    headers: businessHeaders(businessId),
  });
};

export const getAnalyticsBreakdown = async (
  businessId: string,
  params: AnalyticsBreakdownQuery,
) => {
  return http.get("/analytics/breakdown", {
    params,
    headers: businessHeaders(businessId),
  });
};
