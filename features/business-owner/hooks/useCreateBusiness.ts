import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { createBusiness as createBusinessApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { CreateBusinessPayload, ApiSuccessResponse, Business } from "@/types";

type MutationResponse = AxiosResponse<ApiSuccessResponse<Business>>;

export const useCreateBusiness = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const { isPending: isCreating, mutate: createBusiness } = useMutation<
    MutationResponse,
    Error,
    CreateBusinessPayload
  >({
    mutationFn: createBusinessApi,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["checkHasBusiness"] });
      queryClient.invalidateQueries({ queryKey: ["myBusinesses"] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  return { createBusiness, isCreating };
};
