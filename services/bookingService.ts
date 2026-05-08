import { http } from "@/lib";
import {
  CancelBookingPayload,
  CreateBookingPayload,
  CreateReviewPayload,
  UpdateReviewPayload,
} from "@/types";

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
  businessId?: string,
) => {
  const headers = businessId ? { "x-business-id": businessId } : undefined;
  return http.post(
    `/booking/${id}/cancel`,
    payload,
    headers ? { headers } : undefined,
  );
};

/**
 * Review Endpoints — customer-facing. Each booking can have at most one
 * active review; a soft-deleted review unlocks re-submission.
 */

export const submitReview = async (
  bookingId: string,
  payload: CreateReviewPayload,
) => {
  return http.post(`/booking/${bookingId}/review`, payload);
};

export const getBookingReview = async (bookingId: string) => {
  return http.get(`/booking/${bookingId}/review`);
};

export const updateReview = async (
  bookingId: string,
  payload: UpdateReviewPayload,
) => {
  return http.patch(`/booking/${bookingId}/review`, payload);
};

export const deleteReview = async (bookingId: string) => {
  return http.delete(`/booking/${bookingId}/review`);
};
