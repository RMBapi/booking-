import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { register as registerApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { CreateBusinessOwnerPayload, RegisterPayload, AuthResponse } from "@/types";

type MutationResponse = AxiosResponse<AuthResponse>;

type MutationOptions = {
  onSuccess?: (response: MutationResponse) => void;
  onError?: (error: Error) => void;
};

export const useCreateBusinessOwner = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const { isPending: isCreating, mutate } = useMutation<
    MutationResponse,
    Error,
    CreateBusinessOwnerPayload
  >({
    mutationFn: (payload: CreateBusinessOwnerPayload) => {
      // Transform CreateBusinessOwnerPayload to RegisterPayload with Business_owner role
      // Explicitly exclude businessSiteSlug as it's only needed for Customer role
      const registerPayload: RegisterPayload = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        role: "Business_owner",
        // businessSiteSlug is NOT included - only needed for Customer role
      };
      return registerApi(registerPayload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["businessOwners"] });
      handleSuccess("Business owner created successfully!");
    },
  });

  const createBusinessOwner = (
    payload: CreateBusinessOwnerPayload,
    options?: MutationOptions
  ) => {
    mutate(payload, {
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
    });
  };

  return { createBusinessOwner, isCreating };
};
