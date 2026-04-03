import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { addBusinessOwnerByEmail as addBusinessOwnerByEmailApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { ApiSuccessResponse } from "@/types";

type MutationResponse = AxiosResponse<ApiSuccessResponse>;

type MutationVariables = {
  businessId: string;
  email: string;
};

type MutationOptions = {
  onSuccess?: (response: MutationResponse) => void;
  onError?: (error: Error) => void;
};

export const useAddBusinessOwner = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const { isPending: isAdding, mutate } = useMutation<
    MutationResponse,
    Error,
    MutationVariables
  >({
    mutationFn: ({ businessId, email }) =>
      addBusinessOwnerByEmailApi(businessId, email),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["businessOwners", variables.businessId],
      });
      handleSuccess(response);
    },
  });

  const addBusinessOwner = (
    businessId: string,
    email: string,
    options?: MutationOptions
  ) => {
    mutate(
      { businessId, email },
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

  return { addBusinessOwner, isAdding };
};
