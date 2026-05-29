import { http } from "@/lib";
import { ReviewListQuery } from "@/types";

/**
 * Review Service — CRM-facing endpoints (require x-business-id).
 */

export const getReviews = async (
  params?: ReviewListQuery,
  businessId?: string,
) => {
  return http.get("/review", {
    params,
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};

export const getReviewSummary = async (businessId?: string) => {
  return http.get("/review/summary", {
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};
