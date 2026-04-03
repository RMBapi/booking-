import { http } from "@/lib";
import type { ApiSuccessResponse, AvailableSlotsResponse } from "@/types";

export type GetAvailableSlotsParams = {
  serviceId: string;
  date: string;
  businessSlug?: string;
  businessId?: string;
  serviceProviderId?: string;
};

export const getAvailableSlots = async (params: GetAvailableSlotsParams) => {
  const query = new URLSearchParams();
  query.set("serviceId", params.serviceId);
  query.set("date", params.date);
  if (params.businessSlug) query.set("businessSlug", params.businessSlug);
  if (params.serviceProviderId) {
    query.set("serviceProviderId", params.serviceProviderId);
  }

  const headers = params.businessId
    ? { "x-business-id": params.businessId }
    : undefined;
  return http.get<ApiSuccessResponse<AvailableSlotsResponse>>(
    `/scheduler/available-slots?${query.toString()}`,
    headers ? { headers } : undefined,
  );
};
