import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { updateBusiness as updateBusinessApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { UpdateBusinessPayload, ApiSuccessResponse, Business } from "@/types";

type MutationResponse = AxiosResponse<ApiSuccessResponse<Business>>;
type MutationVariables = {
  id: string;
  payload: UpdateBusinessPayload;
};

export const useUpdateBusiness = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const { isPending: isUpdating, mutate: updateBusiness } = useMutation<
    MutationResponse,
    Error,
    MutationVariables
  >({
    mutationFn: ({ id, payload }) => updateBusinessApi(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["myBusinesses"] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  return { updateBusiness, isUpdating };
};
