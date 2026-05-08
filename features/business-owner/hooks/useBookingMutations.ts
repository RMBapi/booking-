import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import {
  cancelBooking as cancelBookingApi,
  createStaffBooking as createStaffBookingApi,
  updateBooking as updateBookingApi,
} from "@/services";
import { getAvailableSlots } from "@/services/schedulerService";
import type {
  AvailableSlotsResponse,
  CancelBookingPayload,
  CreateBookingPayload,
  CreateStaffBookingPayload,
} from "@/types";

type UpdateBookingDto = Partial<
  Pick<
    CreateBookingPayload,
    "serviceId" | "serviceProviderId" | "bookingTime" | "customerNotes"
  >
>;

/**
 * Create a booking on behalf of a customer via POST /booking/staff.
 *
 * Caller must pass `userId` XOR `guest` — the BE returns 400 if both are
 * present. Returns 409 when the slot was just taken; the modal surfaces
 * `error.response.data.message` to the user. Booking list + calendar
 * react-query keys are invalidated on success.
 */
export const useCreateStaffBooking = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffBookingPayload) =>
      createStaffBookingApi(payload, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId] });
    },
  });
};

/**
 * Cancel a booking via POST /booking/:id/cancel.
 *
 * Backend validates the transition: Pending/Confirmed → Cancelled only,
 * rejects past-start-time bookings, and requires `cancellationReason`.
 * Errors come back as Axios error responses; the caller should read
 * `error.response.data.message` for the user-facing copy.
 */
export const useCancelBooking = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelBookingPayload;
    }) => cancelBookingApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId] });
    },
  });
};

/**
 * Update a booking via PATCH /booking/:id.
 *
 * Accepts any combination of serviceId / serviceProviderId / bookingTime /
 * customerNotes. The backend re-runs scheduler validation when timing or
 * service changes and returns 409 on capacity conflicts. Status changes
 * stay on dedicated routes — this hook intentionally does not accept it.
 */
export const useUpdateBooking = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBookingDto }) =>
      updateBookingApi(id, dto, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", businessId] });
    },
  });
};

interface AvailableSlotsParams {
  serviceId: string;
  date: string; // YYYY-MM-DD
  serviceProviderId?: string;
  excludeBookingId?: string;
}

export const useAvailableSlots = (
  businessId: string,
  params: AvailableSlotsParams | null,
) => {
  return useQuery<AxiosResponse<{ data: AvailableSlotsResponse }>>({
    queryKey: [
      "available-slots",
      businessId,
      params?.serviceId,
      params?.date,
      params?.serviceProviderId ?? null,
      params?.excludeBookingId ?? null,
    ],
    queryFn: () =>
      getAvailableSlots(params!.serviceId, {
        date: params!.date,
        serviceProviderId: params!.serviceProviderId,
        excludeBookingId: params!.excludeBookingId,
        businessId,
      }) as Promise<AxiosResponse<{ data: AvailableSlotsResponse }>>,
    enabled: !!params && !!params.serviceId && !!params.date && !!businessId,
  });
};
