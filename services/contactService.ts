import { http } from "@/lib";
import { CreateContactPayload } from "@/types";

/**
 * Contact Service — for non-logged-in users submitting booking requests.
 */

export const createContact = async (
  payload: CreateContactPayload,
  businessSlug?: string,
  businessId?: string,
) => {
  const url = businessSlug
    ? `/contact?businessSlug=${businessSlug}`
    : "/contact";
  const headers = businessId ? { "x-business-id": businessId } : undefined;
  return http.post(url, payload, headers ? { headers } : undefined);
};
