import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getAllBusinessOwners } from "@/services";
import { ApiSuccessResponse, BusinessOwnerWithBusinesses } from "@/types";

export const useGetBusinessOwners = () => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<BusinessOwnerWithBusinesses[]>>>({
    queryKey: ["businessOwners"],
    queryFn: getAllBusinessOwners,
  });

  const businessOwners = response?.data?.data || [];

  return { isLoading, businessOwners, error, refetch };
};
