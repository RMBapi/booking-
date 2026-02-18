import { http } from "@/lib";
import { CreateBusinessOwnerPayload } from "@/types";

/**
 * Super Admin Service
 */

export const createBusinessOwner = async (payload: CreateBusinessOwnerPayload) => {
  return http.post("/admin/business-owner", payload);
};

export const getAllBusinessOwners = async () => {
  return http.get("/admin/business-owners");
};

export const getBusinessOwnerById = async (id: string) => {
  return http.get(`/admin/business-owner/${id}`);
};

export const toggleBusinessOwnerStatus = async (id: string, isActive: boolean) => {
  // If currently active, send false to deactivate
  // If currently inactive, send true to activate
  return http.patch(`/admin/user/${id}`, { isActive: !isActive });
};
