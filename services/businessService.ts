import { http } from "@/lib";
import { CreateBusinessPayload, UpdateBusinessPayload, PaginationParams } from "@/types";

/**
 * Business Service
 */

export const checkHasBusiness = async () => {
  return http.get("/business/check-has-business");
};

export const createBusiness = async (payload: CreateBusinessPayload) => {
  return http.post("/business", payload);
};

export const getMyBusinesses = async () => {
  return http.get("/business/my-businesses");
};

export const getBusinessBySlug = async (slug: string) => {
  // Public endpoint - no auth required (use same-origin proxy to avoid CORS)
  const response = await fetch(`/api/business/slug/${slug}`);
  return response.json();
};

export const getAllBusinesses = async (params?: PaginationParams) => {
  return http.get("/business", { params });
};

export const getBusinessById = async (id: string) => {
  return http.get(`/business/${id}`);
};

export const updateBusiness = async (id: string, payload: UpdateBusinessPayload) => {
  return http.patch(`/business/${id}`, payload);
};

export const deleteBusiness = async (id: string) => {
  return http.delete(`/business/${id}`);
};

/**
 * Business Owner Management
 */
export const getBusinessOwners = async (businessId: string) => {
  return http.get(`/business/${businessId}/owners`);
};

export const addBusinessOwnerByEmail = async (businessId: string, email: string) => {
  return http.post(`/business/${businessId}/owners/by-email`, { email });
};

export const removeBusinessOwner = async (businessId: string, userId: string) => {
  return http.delete(`/business/${businessId}/owners/${userId}`);
};
