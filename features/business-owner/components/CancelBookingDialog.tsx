"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ModalBody,
  ModalHeader,
  ModalShell,
  modalDestructiveButtonClass,
  modalFieldLabelClass,
  modalInputClass,
  modalOutlineButtonClass,
} from "@/components/ui";
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
    <ModalShell open={!!booking} onClose={onClose} size="md" zIndex={60}>
      <ModalHeader
        title="Cancel booking?"
        description={
          customerName
            ? `${customerName}${booking.service?.name ? ` · ${booking.service.name}` : ""}`
            : undefined
        }
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        <p className="text-sm text-text-secondary">
          This sets the booking to <strong>Cancelled</strong>. The customer
          keeps the record on their end.
        </p>

        <div>
          <label htmlFor="cancel-reason" className={modalFieldLabelClass}>
            Reason <span className="text-rose-600">*</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this booking being cancelled?"
            className={modalInputClass}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-text-tertiary">
            <span>Shared with the customer in their record.</span>
            <span className="tabular">
              {reason.length}/{REASON_MAX}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={modalOutlineButtonClass}>
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cancel.isPending}
            className={modalDestructiveButtonClass}
          >
            {cancel.isPending ? "Cancelling…" : "Cancel booking"}
          </button>
        </div>
      </ModalBody>
    </ModalShell>
  );
}
