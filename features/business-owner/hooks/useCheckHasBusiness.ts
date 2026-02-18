import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { checkHasBusiness } from "@/services";
import { ApiSuccessResponse, CheckBusinessResponse } from "@/types";

export const useCheckHasBusiness = () => {
  const {
    isLoading,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<CheckBusinessResponse>>>({
    queryKey: ["checkHasBusiness"],
    queryFn: checkHasBusiness,
  });

  const hasBusiness = response?.data?.data?.hasBusiness || false;

  return { isLoading, hasBusiness, error, refetch };
};
