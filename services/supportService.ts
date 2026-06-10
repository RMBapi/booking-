import { http } from "@/lib";
import type { TicketListQuery, UpdateTicketPayload } from "@/types";

/**
 * Support / Contact Center service — business (tenant) ticket management.
 * All endpoints require the active `x-business-id` header and the relevant
 * feature permission (view_tickets / manage_tickets). They only ever return
 * the active business's tickets. See docs: contact-us-integration.md §5.
 */

const headers = (businessId: string) => ({ "x-business-id": businessId });

export const getAdminTickets = async (
  businessId: string,
  params?: TicketListQuery,
) => {
  return http.get("/support/admin/tickets", {
    params,
    headers: headers(businessId),
  });
};

export const getAdminTicket = async (businessId: string, id: string) => {
  return http.get(`/support/admin/tickets/${id}`, {
    headers: headers(businessId),
  });
};

export const replyToAdminTicket = async (
  businessId: string,
  id: string,
  message: string,
) => {
  return http.post(
    `/support/admin/tickets/${id}/reply`,
    { message },
    { headers: headers(businessId) },
  );
};

export const updateAdminTicket = async (
  businessId: string,
  id: string,
  patch: UpdateTicketPayload,
) => {
  return http.patch(`/support/admin/tickets/${id}`, patch, {
    headers: headers(businessId),
  });
};
