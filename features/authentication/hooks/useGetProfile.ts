import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { getProfile } from "@/services";
import { User } from "@/types";

type ApiSuccess = {
  success: true;
  data: User;
};

export const useGetProfile = () => {
  const {
    isLoading: isGettingProfile,
    data: response,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccess>>({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: false, // Don't auto-fetch, call refetch manually
  });

  const user = response?.data?.data;

  return { isGettingProfile, user, error, refetch };
};
