import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import {
  getServiceProviders,
  createServiceProvider,
  deleteServiceProvider,
  updateServiceProvider,
  ServiceProviderFilters as ServiceProviderFiltersType,
} from "@/services";
import {
  ApiSuccessResponse,
  ServiceProvider,
  CreateServiceProviderPayload,
  UpdateServiceProviderPayload,
  PaginationMeta,
} from "@/types";

export interface ServiceProviderFilters extends ServiceProviderFiltersType {
  page?: number;
  limit?: number;
  serviceId?: string;
  userId?: string;
  search?: string;
}

export const useServiceProviders = (
  businessId: string | null,
  filters: ServiceProviderFilters
) => {
  const queryClient = useQueryClient();

  const {
    isLoading,
    data: response,
    error,
  } = useQuery<
    AxiosResponse<ApiSuccessResponse<ServiceProvider[]>>
  >({
    queryKey: ["serviceProviders", businessId, filters],
    queryFn: () => {
      if (!businessId) {
        throw new Error("Business ID is required to fetch service providers");
      }
      return getServiceProviders(businessId, filters);
    },
    enabled: !!businessId,
  });

  const providers = response?.data?.data || [];
  const meta = response?.data?.meta;

  const createMutation = useMutation({
    mutationFn: (payload: CreateServiceProviderPayload) => {
      if (!businessId) {
        throw new Error("Business ID is required to create service provider");
      }
      return createServiceProvider(businessId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceProviders", businessId],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServiceProviderPayload;
    }) => {
      if (!businessId) {
        throw new Error("Business ID is required to update service provider");
      }
      return updateServiceProvider(businessId, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceProviders", businessId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!businessId) {
        throw new Error("Business ID is required to delete service provider");
      }
      return deleteServiceProvider(businessId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["serviceProviders", businessId],
      });
    },
  });

  return {
    isLoading,
    providers,
    meta,
    error,
    createServiceProvider: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateServiceProvider: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteServiceProvider: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

