import { http } from "@/lib";
import { CreateBookingPayload, CancelBookingPayload } from "@/types";

/**
 * Booking Service — customer-facing endpoints only.
 */

export const createBooking = async (
  payload: CreateBookingPayload,
  businessSlug?: string,
  businessId?: string,
) => {
  const url = businessSlug
    ? `/booking?businessSlug=${businessSlug}`
    : "/booking";
  const headers = businessId ? { "x-business-id": businessId } : undefined;
  return http.post(url, payload, headers ? { headers } : undefined);
};

export const getMyBookings = async () => {
  return http.get("/user/my-bookings");
};

export const getBookingById = async (id: string) => {
  return http.get(`/booking/${id}`);
};

export const cancelBooking = async (
  id: string,
  payload: CancelBookingPayload,
) => {
  return http.post(`/booking/${id}/cancel`, payload);
};
