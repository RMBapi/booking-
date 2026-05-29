import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getReviews } from "@/services";
import { ApiSuccessResponse, Review, ReviewListQuery } from "@/types";

export const useGetReviews = (
  businessId: string,
  params?: ReviewListQuery,
  options?: { enabled?: boolean },
) => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<Review[]>>>({
    queryKey: ["reviews", businessId, params],
    queryFn: () => getReviews(params, businessId),
    enabled: !!businessId && (options?.enabled ?? true),
  });

  const reviews = response?.data?.data || [];
  const meta = response?.data?.meta;

  return { isLoading, reviews, meta, error, refetch };
};
