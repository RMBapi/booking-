import { http } from "@/lib";
import {
  CreateServiceProviderPayload,
  UpdateServiceProviderPayload,
  PaginationParams,
} from "@/types";

/**
 * Service Provider Service
 *
 * All endpoints require the `x-business-id` header.
 */

export interface ServiceProviderFilters extends PaginationParams {
  serviceId?: string;
  userId?: string;
  search?: string;
}

export const getServiceProviders = async (
  businessId: string,
  params?: ServiceProviderFilters
) => {
  return http.get("/service-provider", {
    params,
    headers: { "x-business-id": businessId },
  });
};

export const getServiceProvider = async (
  businessId: string,
  providerId: string
) => {
  return http.get(`/service-provider/${providerId}`, {
    headers: { "x-business-id": businessId },
  });
};

export const createServiceProvider = async (
  businessId: string,
  payload: CreateServiceProviderPayload
) => {
  return http.post("/service-provider", payload, {
    headers: { "x-business-id": businessId },
  });
};

export const updateServiceProvider = async (
  businessId: string,
  id: string,
  payload: UpdateServiceProviderPayload
) => {
  return http.patch(`/service-provider/${id}`, payload, {
    headers: { "x-business-id": businessId },
  });
};

export const deleteServiceProvider = async (
  businessId: string,
  id: string
) => {
  return http.delete(`/service-provider/${id}`, {
    headers: { "x-business-id": businessId },
  });
};

