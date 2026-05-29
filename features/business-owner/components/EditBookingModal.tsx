"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/buttons";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";
import {
  useBusinessServices,
  useUpdateBooking,
  useAvailableSlots,
} from "../hooks";
import { CancelBookingDialog } from "./CancelBookingDialog";
import type { Booking, Service, ServiceProviderSummary } from "@/types";
import { cn } from "@/utils";

interface Props {
  businessId: string;
  booking: Booking | null;
  onClose: () => void;
}

/** Convert ISO datetime → YYYY-MM-DD in the user's local timezone. */
function toDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerLabel(p?: ServiceProviderSummary | null): string {
  if (!p) return "";
  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return name || "Unnamed provider";
}

function providerInitials(p?: ServiceProviderSummary | null): string {
  if (!p) return "?";
  return (
    `${(p.firstName?.[0] ?? "").toUpperCase()}${(p.lastName?.[0] ?? "").toUpperCase()}` ||
    "?"
  );
}

interface ProviderPickerProps {
  providers: ServiceProviderSummary[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

/**
 * Searchable provider picker. Native <select> can't host a search input,
 * so this is a custom button + popover with a filtered list. Closes on
 * outside click or Escape; resets the query when reopened.
 */
function ProviderPicker({
  providers,
  value,
  onChange,
  disabled,
}: ProviderPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = providers.find((p) => p.id === value);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    // Defer focus so the popover is mounted first.
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? providers.filter((p) => providerLabel(p).toLowerCase().includes(q))
    : providers;

  const handlePick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-left transition-colors",
          "hover:border-border-strong focus:border-primary-400 focus:outline-none",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          open && "border-primary-400",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold shrink-0",
            selected
              ? "bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700"
              : "bg-subtle text-text-tertiary",
          )}
        >
          {selected ? providerInitials(selected) : <UserRound className="h-3.5 w-3.5" />}
        </span>
        <span
          className={cn(
            "flex-1 truncate",
            selected ? "text-text-primary" : "text-text-tertiary",
          )}
        >
          {selected ? providerLabel(selected) : "Any available provider"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-text-tertiary shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 mt-1.5 rounded-lg border border-border-subtle bg-surface shadow-lg shadow-black/10 overflow-hidden z-20"
            role="listbox"
          >
            <div className="relative border-b border-border-subtle">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search providers…"
                className="w-full bg-transparent pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => handlePick("")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-subtle transition-colors",
                  !value && "bg-subtle/70",
                )}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-text-tertiary shrink-0">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-text-primary">
                  Any available provider
                </span>
                {!value && <Check className="h-3.5 w-3.5 text-primary-600" />}
              </button>
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-xs text-text-tertiary">
                  No providers match &ldquo;{query}&rdquo;.
                </p>
              ) : (
                filtered.map((p) => {
                  const active = p.id === value;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => handlePick(p.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-subtle transition-colors",
                        active && "bg-subtle/70",
                      )}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[10px] font-semibold shrink-0">
                        {providerInitials(p)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary truncate">
                          {providerLabel(p)}
                        </p>
                        {p.description && (
                          <p className="text-xs text-text-tertiary truncate">
                            {p.description}
                          </p>
                        )}
                      </div>
                      {active && (
                        <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EditBookingModal({ businessId, booking, onClose }: Props) {
  const updateBooking = useUpdateBooking(businessId);
  // Fetch a generous page of services so the booking's current service is in
  // the list even if it's been archived. This dropdown is the only surface
  // where an owner switches a booking from one service to another.
  const { services } = useBusinessServices(businessId, {
    page: 1,
    limit: 100,
  });

  const [serviceId, setServiceId] = useState("");
  const [serviceProviderId, setServiceProviderId] = useState<string>("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Hydrate from the booking each time the modal opens for a new row.
  useEffect(() => {
    if (!booking) return;
    setServiceId(booking.serviceId);
    setServiceProviderId(booking.serviceProviderId ?? "");
    setDate(toDateInput(booking.bookingTime?.start));
    setSlot(
      booking.bookingTime?.start && booking.bookingTime?.end
        ? {
            start: booking.bookingTime.start,
            end: booking.bookingTime.end,
          }
        : null,
    );
    setNotes(booking.customerNotes ?? "");
    setError(null);
  }, [booking]);

  const selectedService: Service | undefined = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  // Service-level services don't take a provider. Hide the dropdown and let
  // the BE auto-disconnect the previous provider.
  const showProviderField =
    !!selectedService &&
    selectedService.allowCustomerChooseProvider !== false &&
    (selectedService.providers?.length ?? 0) > 0;

  // If the previously-attached provider isn't on the newly-chosen service,
  // clear it so we don't PATCH a mismatch.
  useEffect(() => {
    if (!selectedService) return;
    if (!showProviderField) {
      if (serviceProviderId) setServiceProviderId("");
      return;
    }
    const validIds = new Set(
      (selectedService.providers ?? []).map((p) => p.id),
    );
    if (serviceProviderId && !validIds.has(serviceProviderId)) {
      setServiceProviderId("");
    }
  }, [selectedService, showProviderField, serviceProviderId]);

  const slotsQuery = useAvailableSlots(
    businessId,
    booking && serviceId && date
      ? {
          serviceId,
          date,
          serviceProviderId: serviceProviderId || undefined,
          excludeBookingId: booking.id,
        }
      : null,
  );

  const slots = useMemo(() => {
    const payload = slotsQuery.data?.data;
    // The /scheduler/available-slots response is wrapped — pull whichever
    // shape the BE returned (top-level `availableSlots` or nested under
    // `data`). The schedulerService type lists both possibilities.
    if (!payload) return [];
    const inner =
      (payload as { data?: { availableSlots?: unknown; slots?: unknown } })
        .data ?? payload;
    const list =
      (inner as { availableSlots?: unknown[] }).availableSlots ??
      (inner as { slots?: unknown[] }).slots ??
      [];
    return list as Array<{
      start: string;
      end: string;
      available: boolean;
      status?: "free" | "booked";
    }>;
  }, [slotsQuery.data]);

  // Diff against the original booking. Used to gate the Save button and to
  // show the "Originally booked" reference only when the time has actually
  // moved.
  const hasChanges = useMemo(() => {
    if (!booking) return false;
    if (serviceId !== booking.serviceId) return true;
    if ((serviceProviderId || "") !== (booking.serviceProviderId ?? ""))
      return true;
    if (slot?.start !== booking.bookingTime?.start) return true;
    if (slot?.end !== booking.bookingTime?.end) return true;
    if ((notes ?? "") !== (booking.customerNotes ?? "")) return true;
    return false;
  }, [booking, serviceId, serviceProviderId, slot, notes]);

  const timingChanged = useMemo(() => {
    if (!booking) return false;
    return (
      date !== toDateInput(booking.bookingTime?.start) ||
      slot?.start !== booking.bookingTime?.start
    );
  }, [booking, date, slot]);

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
    if (!input || !booking) return;
    if (booking.status === "Cancelled" || booking.status === "Completed") return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // showPicker can throw if called outside a user gesture or while
        // hidden — fall through to focus.
      }
    }
    input.focus();
    input.click();
  };

  if (!booking) return null;

  const customer = booking.user || booking.customer;
  const customerName = customer
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
    : "Customer";
  const initials = customer
    ? `${(customer.firstName?.[0] ?? "").toUpperCase()}${(customer.lastName?.[0] ?? "").toUpperCase()}`
    : "?";

  const isReadOnly =
    booking.status === "Cancelled" || booking.status === "Completed";
  const canCancel =
    booking.status !== "Cancelled" && booking.status !== "Completed";

  const handleSave = async () => {
    setError(null);
    if (!serviceId) {
      setError("Pick a service.");
      return;
    }
    if (!slot) {
      setError("Pick an available time slot.");
      return;
    }

    // Diff against the original booking — PATCH only what changed.
    const dto: {
      serviceId?: string;
      serviceProviderId?: string;
      bookingTime?: { start: string; end: string };
      customerNotes?: string;
    } = {};
    if (serviceId !== booking.serviceId) dto.serviceId = serviceId;
    const originalProviderId = booking.serviceProviderId ?? "";
    if (serviceProviderId !== originalProviderId) {
      // Empty string clears the provider on service-level services.
      dto.serviceProviderId = serviceProviderId || undefined;
    }
    if (
      slot.start !== booking.bookingTime?.start ||
      slot.end !== booking.bookingTime?.end
    ) {
      dto.bookingTime = slot;
    }
    if ((notes ?? "") !== (booking.customerNotes ?? "")) {
      dto.customerNotes = notes;
    }

    if (Object.keys(dto).length === 0) {
      onClose();
      return;
    }

    try {
      await updateBooking.mutateAsync({ id: booking.id, dto });
      toast.success("Booking updated");
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const text = Array.isArray(message) ? message.join(" ") : message;
      setError(
        typeof text === "string" && text ? text : "Couldn't save changes.",
      );
    }
  };

  return (
    <>
      <ModalShell open onClose={onClose} size="xl">
        <ModalHeader eyebrow="Booking" title="Edit booking" onClose={onClose} />

        <ModalBody className="space-y-5">
              {/* Customer summary */}
              <div className="rounded-xl border border-border-subtle bg-subtle/50 px-4 py-3 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-xs font-semibold">
                  {initials || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {customerName}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    {customer?.email ?? "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    booking.status === "Confirmed" &&
                      "border-emerald-100 bg-emerald-50/70 text-emerald-700",
                    booking.status === "Pending" &&
                      "border-amber-100 bg-amber-50/70 text-amber-700",
                    booking.status === "Cancelled" &&
                      "border-rose-100 bg-rose-50/70 text-rose-700",
                    booking.status === "Completed" &&
                      "border-primary-100 bg-primary-50/70 text-primary-700",
                  )}
                >
                  {booking.status}
                </span>
              </div>

              {isReadOnly && (
                <div
                  className={cn(
                    "rounded-lg border px-3.5 py-2.5 text-sm",
                    booking.status === "Cancelled"
                      ? "border-rose-100 bg-rose-50/60 text-rose-700"
                      : "border-primary-100 bg-primary-50/60 text-primary-700",
                  )}
                >
                  {booking.status === "Cancelled"
                    ? "This booking is cancelled. Edits aren't allowed."
                    : "This booking is completed. Edits aren't allowed."}
                </div>
              )}

              {/* Service */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Service
                </h3>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <select
                    disabled={isReadOnly}
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-border-default bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary focus:border-primary-400 focus:outline-none disabled:opacity-60"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Provider */}
              {showProviderField ? (
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Provider
                  </h3>
                  <ProviderPicker
                    providers={selectedService?.providers ?? []}
                    value={serviceProviderId}
                    onChange={(id) => setServiceProviderId(id)}
                    disabled={isReadOnly}
                  />
                </div>
              ) : (
                selectedService && (
                  <p className="text-xs text-text-tertiary">
                    This service uses shared capacity — no provider to pick.
                  </p>
                )
              )}

              {/* Date */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Date &amp; time
                  </h3>
                  {timingChanged && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
                      <RotateCcw className="h-3 w-3" />
                      was {formatDateTime(booking.bookingTime?.start)}
                    </span>
                  )}
                </div>
                {/* The whole field is a click target — clicking anywhere on
                    the row opens the native date picker via showPicker(). The
                    underlying <input> is still keyboard-accessible. */}
                <div
                  role="button"
                  tabIndex={isReadOnly ? -1 : 0}
                  onClick={handleOpenDatePicker}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenDatePicker();
                    }
                  }}
                  className={cn(
                    "relative w-full flex items-center gap-2.5 rounded-lg border border-border-default bg-surface px-3 py-2.5 text-sm transition-colors",
                    !isReadOnly &&
                      "cursor-pointer hover:border-border-strong focus-within:border-primary-400 focus-within:outline-none",
                    isReadOnly && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-text-tertiary shrink-0" />
                  <input
                    ref={dateInputRef}
                    type="date"
                    disabled={isReadOnly}
                    min={todayStr}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSlot(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-text-primary focus:outline-none disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Time slots */}
              <div>
                <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  Available times
                </h3>
                {!serviceId || !date ? (
                  <p className="text-xs text-text-tertiary">
                    Pick a service and date to see available times.
                  </p>
                ) : slotsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading slots…
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-text-tertiary">
                    No slots configured for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const isSelected =
                        slot?.start === s.start && slot?.end === s.end;
                      const disabled = !s.available && !isSelected;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          disabled={disabled || isReadOnly}
                          onClick={() =>
                            setSlot({ start: s.start, end: s.end })
                          }
                          className={cn(
                            "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                            isSelected
                              ? "border-primary-400 bg-primary-50 text-primary-700"
                              : disabled
                                ? "border-border-subtle bg-subtle/50 text-text-quaternary line-through cursor-not-allowed"
                                : "border-border-subtle bg-surface text-text-primary hover:border-border-default",
                          )}
                        >
                          <Clock className="h-3 w-3 opacity-70" />
                          {formatTime(s.start)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Notes
                  <span className="ml-1.5 text-[10px] font-normal text-text-tertiary normal-case tracking-normal">
                    (optional)
                  </span>
                </h3>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-text-tertiary pointer-events-none" />
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    placeholder="Anything the provider should know."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full resize-none rounded-lg border border-border-default bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}
        </ModalBody>

        <ModalFooter className="justify-between">
          <button
            type="button"
            disabled={!canCancel}
            onClick={() => setConfirmCancel(true)}
            title={
              !canCancel
                ? "This booking can't be cancelled."
                : undefined
            }
            className={cn(
              "text-xs font-semibold transition-colors",
              canCancel
                ? "text-rose-600 hover:text-rose-700"
                : "text-text-quaternary cursor-not-allowed",
            )}
          >
            Cancel booking
          </button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isReadOnly || !hasChanges}
            isLoading={updateBooking.isPending}
            title={
              !hasChanges && !isReadOnly
                ? "Nothing to save yet."
                : undefined
            }
          >
            Save changes
          </Button>
        </ModalFooter>
      </ModalShell>

      <CancelBookingDialog
        businessId={businessId}
        booking={confirmCancel ? booking : null}
        onClose={() => setConfirmCancel(false)}
        onCancelled={onClose}
      />
    </>
  );
}
