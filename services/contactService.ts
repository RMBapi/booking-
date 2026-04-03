import { http } from "@/lib";
import { ContactListQuery, CreateContactPayload } from "@/types";

/**
 * Contact Service
 * Used for non-logged-in users to submit booking requests
 */

export const createContact = async (
  payload: CreateContactPayload,
  businessSlug?: string
) => {
  const url = businessSlug
    ? `/contact?businessSlug=${businessSlug}`
    : "/contact";
  return http.post(url, payload);
};

export const getAllContacts = async (
  params?: ContactListQuery,
  businessId?: string
) => {
  return http.get("/contact", {
    params,
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};

export const getContactById = async (id: string) => {
  return http.get(`/contact/${id}`);
};
