import { http } from "@/lib";
import type { DashboardSummaryQuery } from "@/types";

export const getDashboardSummary = async (
  businessId: string,
  params?: DashboardSummaryQuery,
) => {
  return http.get("/dashboard/summary", {
    params,
    headers: { "x-business-id": businessId },
  });
};
