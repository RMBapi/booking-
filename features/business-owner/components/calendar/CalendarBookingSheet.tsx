"use client";

import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Pencil,
  UserRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/buttons";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  StatusPill,
  type StatusTone,
} from "@/components/ui";
import { useUpdateBookingStatus } from "../../hooks";
import * as toast from "@/lib/toast";
import type { Booking, BookingStatus } from "@/types";
import { cn } from "@/utils";

interface Props {
  businessId: string;
  booking: Booking | null;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onUpdated?: () => void;
}

function statusTone(status: BookingStatus): StatusTone {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Pending":
      return "warning";
    case "Cancelled":
      return "danger";
    case "Completed":
      return "info";
    default:
      return "neutral";
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CalendarBookingSheet({
  businessId,
  booking,
  onClose,
  onEdit,
  onCancel,
  onUpdated,
}: Props) {
  const { updateStatus, isUpdating } = useUpdateBookingStatus();

  if (!booking) return null;

  const cust = booking.user || booking.customer;
  const customerName = cust
    ? `${cust.firstName} ${cust.lastName ?? ""}`.trim()
    : "Customer";
  const provider = booking.serviceProvider;
  const providerName = provider
    ? `${provider.firstName ?? ""} ${provider.lastName ?? ""}`.trim()
    : null;
  const isEditable = booking.status !== "Cancelled" && booking.status !== "Completed";

  const handleConfirm = () => {
    updateStatus(
      { id: booking.id, status: "Confirmed", businessId },
      {
        onSuccess: () => {
          toast.success("Booking confirmed");
          onUpdated?.();
          onClose();
        },
      },
    );
  };

  const handleComplete = () => {
    updateStatus(
      { id: booking.id, status: "Completed", businessId },
      {
        onSuccess: () => {
          toast.success("Booking marked as completed");
          onUpdated?.();
          onClose();
        },
      },
    );
  };

  return (
    <ModalShell open={!!booking} onClose={onClose} size="md">
      <ModalHeader
        eyebrow="Booking"
        title={customerName}
        onClose={onClose}
      >
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StatusPill tone={statusTone(booking.status)}>{booking.status}</StatusPill>
          {booking.service?.name && (
            <span className="text-xs text-text-tertiary">{booking.service.name}</span>
          )}
        </div>
      </ModalHeader>

      <ModalBody className="space-y-3 text-sm py-4">
        <div className="flex items-start gap-2.5 text-text-secondary">
          <Clock className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">
              {formatWhen(booking.bookingTime.start)}
            </p>
            <p className="text-xs text-text-tertiary">
              until {formatWhen(booking.bookingTime.end)}
            </p>
          </div>
        </div>
        {providerName && (
          <div className="flex items-center gap-2.5 text-text-secondary">
            <UserRound className="h-4 w-4 text-text-tertiary shrink-0" />
            <span>{providerName}</span>
          </div>
        )}
        {booking.customerNotes && (
          <p className="text-xs text-text-tertiary bg-subtle rounded-lg px-3 py-2">
            {booking.customerNotes}
          </p>
        )}
      </ModalBody>

      <ModalFooter className="flex-col items-stretch">
        {booking.status === "Pending" && (
          <Button
            type="button"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={handleConfirm}
            disabled={isUpdating}
            isLoading={isUpdating}
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm booking
          </Button>
        )}
        {booking.status === "Confirmed" && (
          <Button
            type="button"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={handleComplete}
            disabled={isUpdating}
            isLoading={isUpdating}
          >
            <BadgeCheck className="h-4 w-4" />
            Mark completed
          </Button>
        )}
        {isEditable && (
          <button
            type="button"
            onClick={() => {
              onEdit(booking);
              onClose();
            }}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg",
              "border border-border-default bg-surface text-sm font-medium text-text-primary hover:bg-subtle transition-colors",
            )}
          >
            <Pencil className="h-4 w-4" />
            Edit booking
          </button>
        )}
        {isEditable && (
          <button
            type="button"
            onClick={() => {
              onCancel(booking);
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel booking
          </button>
        )}
      </ModalFooter>
    </ModalShell>
  );
}
