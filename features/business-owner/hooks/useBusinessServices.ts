import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
} from "@/services";
import {
  ApiSuccessResponse,
  Service,
  CreateServicePayload,
  UpdateServicePayload,
} from "@/types";
import { useApiResponse } from "@/hooks";

export interface ServiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
}

export const useBusinessServices = (
  businessId: string | null,
  filters: ServiceFilters
) => {
  const queryClient = useQueryClient();
  const { handleSuccess, handleError } = useApiResponse();

  const {
    isLoading,
    data: response,
    error,
  } = useQuery<AxiosResponse<ApiSuccessResponse<Service[]>>>({
    queryKey: ["businessServices", businessId, filters],
    queryFn: () => {
      if (!businessId) {
        throw new Error("Business ID is required to fetch services");
      }
      return getAllServices(
        {
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          status: filters.status,
          isActive: filters.isActive,
        },
        businessId
      );
    },
    enabled: !!businessId,
  });

  const services = response?.data?.data || [];
  const meta = response?.data?.meta;

  const createMutation = useMutation({
    mutationFn: (payload: CreateServicePayload) => {
      if (!businessId) {
        throw new Error("Business ID is required to create service");
      }
      return createService(payload, businessId);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["businessServices", businessId],
      });
      handleSuccess(response);
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServicePayload;
    }) => {
      if (!businessId) {
        throw new Error("Business ID is required to update service");
      }
      return updateService(id, data, businessId);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["businessServices", businessId],
      });
      handleSuccess(response);
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!businessId) {
        throw new Error("Business ID is required to delete service");
      }
      return deleteService(id, businessId);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["businessServices", businessId],
      });
      handleSuccess(response);
    },
    onError: handleError,
  });

  return {
    isLoading,
    services,
    meta,
    error,
    createService: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateService: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteService: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

