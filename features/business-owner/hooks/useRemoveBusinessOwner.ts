import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { removeBusinessOwner as removeBusinessOwnerApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { ApiSuccessResponse } from "@/types";

type MutationResponse = AxiosResponse<ApiSuccessResponse>;

type MutationVariables = {
  businessId: string;
  userId: string;
};

type MutationOptions = {
  onSuccess?: (response: MutationResponse) => void;
  onError?: (error: Error) => void;
};

export const useRemoveBusinessOwner = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const { isPending: isRemoving, mutate } = useMutation<
    MutationResponse,
    Error,
    MutationVariables
  >({
    mutationFn: ({ businessId, userId }) =>
      removeBusinessOwnerApi(businessId, userId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["businessOwners", variables.businessId],
      });
      handleSuccess(response);
    },
  });

  const removeBusinessOwner = (
    businessId: string,
    userId: string,
    options?: MutationOptions
  ) => {
    mutate(
      { businessId, userId },
      {
        onSuccess: (response) => {
          options?.onSuccess?.(response);
        },
        onError: (error) => {
          // Use custom error handler if provided, otherwise use default
          if (options?.onError) {
            options.onError(error);
          } else {
            handleError(error);
          }
        },
      }
    );
  };

  return { removeBusinessOwner, isRemoving };
};
