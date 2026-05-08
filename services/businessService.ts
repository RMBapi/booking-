import { http } from "@/lib";
import {
  Business,
  CreateBusinessPayload,
  CreateOwnBusinessDto,
  UpdateBusinessPayload,
  PaginationParams,
} from "@/types";

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

// `POST /business/:id/owners/by-email` is deprecated server-side and no
// longer called by the FE. New team additions go through the invitation
// flow (services/invitationService.ts). The endpoint stays alive on the
// backend for backwards compatibility — see docs/api-conventions.md.

export const removeBusinessOwner = async (businessId: string, userId: string) => {
  return http.delete(`/business/${businessId}/owners/${userId}`);
};

/**
 * POST /business/onboarding — Business_owner self-onboards their first
 * business after the forced password change. Backend takes the slug
 * literally; the frontend MUST normalise it (see /onboarding/business).
 *
 * Errors:
 *   409  "already have a business" OR "slug taken" — disambiguate via
 *        the message text
 *   400  validation
 *   403  not Business_owner (route guard should prevent this)
 */
export const onboardBusiness = async (
  dto: CreateOwnBusinessDto,
): Promise<Business> => {
  const res = await http.post("/business/onboarding", dto);
  const body = res.data?.data ?? res.data;
  return body as Business;
};
