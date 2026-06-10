import { http } from "@/lib";
import { CreateTicketPayload, MyTicketsQuery } from "@/types";

/**
 * Support / Contact Us Service — customer-facing endpoints only.
 *
 * Tickets are scoped to the business the customer's session belongs to, so the
 * my-tickets endpoints need no business header — the token already carries it.
 */

/**
 * Submit a new ticket. Logged-in customers send only subject + message; the
 * requester's name/email/phone come from their profile. `businessSlug` is
 * optional when the token is already scoped to a single business.
 */
export const submitTicket = async (payload: CreateTicketPayload) => {
  return http.post("/support/tickets", payload);
};

/** List the logged-in customer's own tickets (paginated). */
export const getMyTickets = async (params?: MyTicketsQuery) => {
  return http.get("/support/my-tickets", { params });
};

/** One ticket plus its full conversation thread. */
export const getMyTicket = async (id: string) => {
  return http.get(`/support/my-tickets/${id}`);
};

/** Add a reply to a ticket. Re-opens the ticket (status → Open). */
export const replyToMyTicket = async (id: string, message: string) => {
  return http.post(`/support/my-tickets/${id}/reply`, { message });
};
