import { http } from "@/lib";
import { BookingListQuery, CreateBookingPayload, CancelBookingPayload } from "@/types";

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
