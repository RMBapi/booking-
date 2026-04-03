import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getMyBusinesses } from "@/services";
import { ApiSuccessResponse, Business } from "@/types";

export const useGetMyBusinesses = () => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<Business[]>>>({
    queryKey: ["myBusinesses"],
    queryFn: getMyBusinesses,
  });

  const businesses = response?.data?.data || [];

  return { isLoading, businesses, error, refetch };
};
