"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useCancelBooking } from "../hooks";
import type { Booking } from "@/types";

interface Props {
  businessId: string;
  booking: Booking | null;
  onClose: () => void;
  onCancelled?: () => void;
}

const REASON_MAX = 500;

export function CancelBookingDialog({
  businessId,
  booking,
  onClose,
  onCancelled,
}: Props) {
  const cancel = useCancelBooking(businessId);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setReason("");
      setError(null);
    }
  }, [booking]);

  if (!booking) return null;

  const handleConfirm = async () => {
    setError(null);
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please provide a reason for the cancellation.");
      return;
    }
    if (trimmed.length > REASON_MAX) {
      setError(`Reason must be ${REASON_MAX} characters or fewer.`);
      return;
    }

    try {
      await cancel.mutateAsync({
        id: booking.id,
        payload: { cancellationReason: trimmed },
      });
      toast.success("Booking cancelled");
      onCancelled?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const text = Array.isArray(message) ? message.join(" ") : message;
      setError(
        typeof text === "string" && text
          ? text
          : "Couldn't cancel booking. Try again.",
      );
    }
  };

  const customer = booking.user || booking.customer;
  const customerName =
    customer && `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl shadow-black/10">
        <header className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            Cancel booking?
          </h2>
          {customerName && (
            <p className="mt-0.5 text-xs text-text-tertiary">
              {customerName}
              {booking.service?.name ? ` · ${booking.service.name}` : ""}
            </p>
          )}
        </header>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            This sets the booking to <strong>Cancelled</strong>. The customer
            keeps the record on their end.
          </p>

          <div>
            <label
              htmlFor="cancel-reason"
              className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5"
            >
              Reason <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this booking being cancelled?"
              className="w-full resize-none rounded-lg border border-border-default bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-text-tertiary">
              <span>Shared with the customer in their record.</span>
              <span className="tabular">
                {reason.length}/{REASON_MAX}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-default text-text-primary text-sm font-semibold px-4 py-2 hover:bg-subtle"
            >
              Keep booking
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={cancel.isPending}
              className="rounded-lg bg-rose-600 text-white text-sm font-semibold px-4 py-2 hover:bg-rose-700 disabled:opacity-50"
            >
              {cancel.isPending ? "Cancelling…" : "Cancel booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
