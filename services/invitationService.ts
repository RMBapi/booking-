import { http } from "@/lib";
import type {
  CreateInvitationPayload,
  InvitationView,
  PendingInvitation,
} from "@/types";

// ─── Owner-side (auth required, business-scoped via path param) ─────────

export const createInvitation = async (
  businessId: string,
  payload: CreateInvitationPayload,
) => {
  return http.post(`/business/${businessId}/invitations`, payload);
};

export const listInvitations = async (
  businessId: string,
): Promise<PendingInvitation[]> => {
  const res = await http.get(`/business/${businessId}/invitations`);
  return res.data?.data ?? res.data ?? [];
};

export const revokeInvitation = async (
  businessId: string,
  invitationId: string,
) => {
  return http.delete(`/business/${businessId}/invitations/${invitationId}`);
};

// ─── Public / invitee-side ─────────────────────────────────────────────

const baseURL =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const getInvitationByToken = async (
  token: string,
): Promise<InvitationView> => {
  const res = await fetch(
    `${baseURL}/invitations/${encodeURIComponent(token)}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error(`Invitation lookup failed (${res.status})`);
  const json = await res.json();
  return json?.data ?? json;
};

export const acceptInvitation = async (token: string) => {
  return http.post(`/invitations/${encodeURIComponent(token)}/accept`);
};
