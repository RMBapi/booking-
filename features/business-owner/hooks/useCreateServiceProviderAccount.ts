import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { register } from "@/services";
import { AuthResponse, RegisterPayload } from "@/types";
import { useApiResponse } from "@/hooks";

export const useCreateServiceProviderAccount = () => {
  const { handleSuccess, handleError } = useApiResponse();

  const mutation = useMutation<
    AxiosResponse<AuthResponse>,
    Error,
    Omit<RegisterPayload, "role">
  >({
    mutationFn: (payload) => {
      return register({
        ...payload,
        role: "Service_Provider",
      });
    },
    onSuccess: (response) => {
      handleSuccess("Service provider account created successfully!");
    },
    onError: handleError,
  });

  return {
    createServiceProviderAccount: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
};
