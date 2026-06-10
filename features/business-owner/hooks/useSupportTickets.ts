import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import {
  getAdminTickets,
  getAdminTicket,
  replyToAdminTicket,
  updateAdminTicket,
} from "@/services";
import type {
  ApiSuccessResponse,
  Ticket,
  TicketDetail,
  TicketListQuery,
  UpdateTicketPayload,
} from "@/types";
import { useApiResponse } from "@/hooks";

/**
 * Contact Center ticket list. Mirrors useBusinessServices: react-query under a
 * business-scoped key, with the active businessId driving `enabled`.
 */
export const useSupportTickets = (
  businessId: string | null,
  filters: TicketListQuery,
) => {
  const { isLoading, data: response, error } = useQuery<
    AxiosResponse<ApiSuccessResponse<Ticket[]>>
  >({
    queryKey: ["supportTickets", businessId, filters],
    queryFn: () => {
      if (!businessId) {
        throw new Error("Business ID is required to fetch tickets");
      }
      return getAdminTickets(businessId, filters);
    },
    enabled: !!businessId,
  });

  return {
    isLoading,
    tickets: response?.data?.data ?? [],
    meta: response?.data?.meta,
    error,
  };
};

/**
 * Single ticket + conversation, plus reply and status/assignment mutations.
 * On success both the detail and the list cache are invalidated.
 */
export const useSupportTicket = (
  businessId: string | null,
  ticketId: string | null,
) => {
  const queryClient = useQueryClient();
  const { handleSuccess, handleError } = useApiResponse();

  const detailKey = ["supportTicket", businessId, ticketId];

  const { isLoading, data: response, error } = useQuery<
    AxiosResponse<ApiSuccessResponse<TicketDetail>>
  >({
    queryKey: detailKey,
    queryFn: () => {
      if (!businessId || !ticketId) {
        throw new Error("Business ID and ticket ID are required");
      }
      return getAdminTicket(businessId, ticketId);
    },
    enabled: !!businessId && !!ticketId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: ["supportTickets", businessId] });
  };

  const replyMutation = useMutation({
    mutationFn: (message: string) => {
      if (!businessId || !ticketId) {
        throw new Error("Business ID and ticket ID are required to reply");
      }
      return replyToAdminTicket(businessId, ticketId, message);
    },
    onSuccess: (res) => {
      invalidate();
      handleSuccess(res);
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: UpdateTicketPayload) => {
      if (!businessId || !ticketId) {
        throw new Error("Business ID and ticket ID are required to update");
      }
      return updateAdminTicket(businessId, ticketId, patch);
    },
    onSuccess: (res) => {
      invalidate();
      handleSuccess(res);
    },
    onError: handleError,
  });

  return {
    isLoading,
    ticket: response?.data?.data,
    error,
    reply: replyMutation.mutate,
    isReplying: replyMutation.isPending,
    updateTicket: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
