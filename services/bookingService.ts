import { http } from "@/lib";
import {
  BookingListQuery,
  CreateBookingPayload,
  CancelBookingPayload,
  CreateStaffBookingPayload,
} from "@/types";

/**
 * Booking Service
 */

export const getAllBookings = async (
  params?: BookingListQuery,
  businessId?: string
) => {
  return http.get("/booking", {
    params,
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};

export const getBookingById = async (id: string) => {
  return http.get(`/booking/${id}`);
};

export const getMyBookings = async () => {
  return http.get("/user/my-bookings");
};

export const createBooking = async (
  payload: CreateBookingPayload,
  businessSlug?: string
) => {
  const url = businessSlug
    ? `/booking?businessSlug=${businessSlug}`
    : "/booking";
  return http.post(url, payload);
};

/**
 * Staff-initiated booking via POST /booking/staff. Requires the
 * `manage_bookings` permission on the caller's membership and an
 * `x-business-id` header. Caller must supply `userId` XOR `guest` — the
 * BE rejects both. Returns 409 when the slot was just taken.
 */
export const createStaffBooking = async (
  payload: CreateStaffBookingPayload,
  businessId: string,
) => {
  return http.post("/booking/staff", payload, {
    headers: { "x-business-id": businessId },
  });
};

export const cancelBooking = async (id: string, payload: CancelBookingPayload) => {
  return http.post(`/booking/${id}/cancel`, payload);
};

export const updateBooking = async (
  id: string,
  payload: Partial<CreateBookingPayload>,
  businessId?: string
) => {
  return http.patch(`/booking/${id}`, payload, {
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};

export const deleteBooking = async (id: string) => {
  return http.delete(`/booking/${id}`);
};
