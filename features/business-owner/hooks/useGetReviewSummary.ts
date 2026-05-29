import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getReviewSummary } from "@/services";
import { ApiSuccessResponse, ReviewSummary } from "@/types";

export const useGetReviewSummary = (
  businessId: string,
  options?: { enabled?: boolean },
) => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<ReviewSummary>>>({
    queryKey: ["reviewSummary", businessId],
    queryFn: () => getReviewSummary(businessId),
    enabled: !!businessId && (options?.enabled ?? true),
  });

  const summary = response?.data?.data ?? null;

  return { isLoading, summary, error, refetch };
};
