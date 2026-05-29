import { http } from "@/lib";
import type { ActivityFeedQuery } from "@/types";

export const getActivityFeed = async (
  businessId: string,
  params?: ActivityFeedQuery,
) => {
  return http.get("/activity", {
    params,
    headers: { "x-business-id": businessId },
  });
};
