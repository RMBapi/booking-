import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getBusinessOwners } from "@/services";
import { ApiSuccessResponse, BusinessOwner } from "@/types";

export const useGetBusinessOwners = (businessId: string) => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<BusinessOwner[]>>>({
    queryKey: ["businessOwners", businessId],
    queryFn: () => getBusinessOwners(businessId),
    enabled: !!businessId,
  });

  const owners = response?.data?.data || [];

  return { isLoading, owners, error, refetch };
};
