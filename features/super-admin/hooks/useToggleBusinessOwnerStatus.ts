import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { toggleBusinessOwnerStatus as toggleStatusApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { ApiSuccessResponse } from "@/types";

type MutationResponse = AxiosResponse<ApiSuccessResponse<any>>;

type ToggleStatusParams = {
  id: string;
  isActive: boolean;
};

export const useToggleBusinessOwnerStatus = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const { isPending: isToggling, mutate: toggleStatus } = useMutation<
    MutationResponse,
    Error,
    ToggleStatusParams
  >({
    mutationFn: ({ id, isActive }) => toggleStatusApi(id, isActive),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["businessOwners"] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  return { toggleStatus, isToggling };
};
