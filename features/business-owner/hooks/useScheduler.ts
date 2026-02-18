import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import {
  createScheduler,
  getScheduler,
  updateScheduler,
  deleteScheduler,
  CreateSchedulerRequest,
  UpdateSchedulerRequest,
  Scheduler,
} from "@/services";
import { useApiResponse } from "@/hooks";
import { queryClient } from "@/lib";
import { ApiSuccessResponse } from "@/types";

type CreateMutationResponse = AxiosResponse<ApiSuccessResponse<Scheduler>>;
type UpdateMutationResponse = AxiosResponse<ApiSuccessResponse<Scheduler>>;
type DeleteMutationResponse = AxiosResponse<ApiSuccessResponse<void>>;

interface UseSchedulerOptions {
  businessId: string | null;
  serviceId: string;
  enabled?: boolean;
}

export const useScheduler = ({ businessId, serviceId, enabled = true }: UseSchedulerOptions) => {
  const { handleSuccess, handleError } = useApiResponse();

  // Get scheduler query
  const {
    data: schedulerResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<AxiosResponse<ApiSuccessResponse<Scheduler>>>({
    queryKey: ["scheduler", businessId, serviceId],
    queryFn: () => getScheduler(businessId!, serviceId),
    enabled: enabled && !!businessId && !!serviceId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (scheduler doesn't exist)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const scheduler = schedulerResponse?.data?.data || null;
  const schedulerExists = !!scheduler;

  // Create scheduler mutation
  const {
    isPending: isCreating,
    mutate: create,
  } = useMutation<CreateMutationResponse, Error, CreateSchedulerRequest>({
    mutationFn: (data) => createScheduler(businessId!, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["scheduler", businessId, serviceId] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  // Update scheduler mutation
  const {
    isPending: isUpdating,
    mutate: update,
  } = useMutation<UpdateMutationResponse, Error, UpdateSchedulerRequest>({
    mutationFn: (data) => updateScheduler(businessId!, serviceId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["scheduler", businessId, serviceId] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  // Delete scheduler mutation
  const {
    isPending: isDeleting,
    mutate: deleteSchedulerMutation,
  } = useMutation<DeleteMutationResponse, Error, void>({
    mutationFn: () => deleteScheduler(businessId!, serviceId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["scheduler", businessId, serviceId] });
      handleSuccess(response);
    },
    onError: handleError,
  });

  return {
    scheduler,
    schedulerExists,
    isLoading,
    error,
    refetch,
    create,
    isCreating,
    update,
    isUpdating,
    deleteScheduler: deleteSchedulerMutation,
    isDeleting,
  };
};
