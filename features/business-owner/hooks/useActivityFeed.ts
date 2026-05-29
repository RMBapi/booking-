import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getActivityFeed } from "@/services";
import type { ActivityFeed, ActivityFeedQuery, ApiSuccessResponse } from "@/types";

export const useActivityFeed = (
  businessId: string,
  params?: ActivityFeedQuery,
  options?: { enabled?: boolean },
) => {
  const { isLoading, data: response, error, refetch } = useQuery<
    AxiosResponse<ApiSuccessResponse<ActivityFeed>>
  >({
    queryKey: ["activityFeed", businessId, params],
    queryFn: () => getActivityFeed(businessId, params),
    enabled: !!businessId && (options?.enabled ?? true),
  });

  const feed = response?.data?.data;

  return {
    isLoading,
    items: feed?.items ?? [],
    nextCursor: feed?.nextCursor ?? null,
    error,
    refetch,
  };
};
