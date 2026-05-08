"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AtSign,
  Briefcase,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Phone,
  Search,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/buttons";
import * as toast from "@/lib/toast";
import { cn } from "@/utils";
import {
  useAvailableSlots,
  useBusinessServices,
  useCreateStaffBooking,
  useLookupUserByEmail,
  useSearchUsers,
} from "../hooks";
import type {
  CreateStaffBookingPayload,
  Service,
  ServiceProviderSummary,
  UserLookupResult,
} from "@/types";

interface Props {
  businessId: string;
  open: boolean;
  onClose: () => void;
  /** Pre-fill date (YYYY-MM-DD). Used when the modal is opened from a calendar slot click. */
  initialDate?: string;
  /** Pre-fill start time (ISO). Slot must exist in the day's available-slots list to be auto-selected. */
  initialStart?: string;
  /** Pre-fill provider. The matching service is still chosen by the user. */
  initialProviderId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function providerLabel(p?: ServiceProviderSummary | null): string {
  if (!p) return "";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unnamed provider";
}

function userFullName(u: UserLookupResult): string {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
}

function userInitials(u: UserLookupResult): string {
  return (
    `${(u.firstName?.[0] ?? "").toUpperCase()}${(u.lastName?.[0] ?? "").toUpperCase()}` ||
    "?"
  );
}

interface CustomerStepProps {
  businessId: string;
  email: string;
  setEmail: (v: string) => void;
  selectedUser: UserLookupResult | null;
  setSelectedUser: (u: UserLookupResult | null) => void;
  guestFirstName: string;
  setGuestFirstName: (v: string) => void;
  guestLastName: string;
  setGuestLastName: (v: string) => void;
  guestPhone: string;
  setGuestPhone: (v: string) => void;
}

/**
 * Email-driven customer picker. Runs a partial-match search for the
 * autocomplete dropdown and a full lookup once the email parses; if the
 * lookup 404s, the guest fields are revealed with phone required.
 */
function CustomerStep({
  businessId,
  email,
  setEmail,
  selectedUser,
  setSelectedUser,
  guestFirstName,
  setGuestFirstName,
  guestLastName,
  setGuestLastName,
  guestPhone,
  setGuestPhone,
}: CustomerStepProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the autocomplete query so we don't fire on every keystroke.
  const [debounced, setDebounced] = useState(email);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(email), 200);
    return () => window.clearTimeout(t);
  }, [email]);

  const searchQuery = useSearchUsers(
    businessId,
    selectedUser ? "" : debounced,
  );
  const lookupQuery = useLookupUserByEmail(
    businessId,
    selectedUser ? "" : email,
  );

  // Sync the chosen user when the email lookup resolves to a hit. Only
  // promote to `selectedUser` when the typed email matches the result —
  // otherwise an out-of-date lookup could lock the wrong customer.
  useEffect(() => {
    const hit = lookupQuery.data;
    if (
      hit &&
      !selectedUser &&
      hit.email.trim().toLowerCase() === email.trim().toLowerCase()
    ) {
      setSelectedUser(hit);
    }
  }, [lookupQuery.data, email, selectedUser, setSelectedUser]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const suggestions = searchQuery.data ?? [];
  const hasValidEmail = EMAIL_RE.test(email.trim());
  const isLookingUp = lookupQuery.isFetching;
  // Guest mode: a fully-formed email that the BE has confirmed isn't a user.
  const isGuestMode =
    !selectedUser &&
    hasValidEmail &&
    !isLookingUp &&
    lookupQuery.data === null;

  const handlePick = (u: UserLookupResult) => {
    setSelectedUser(u);
    setEmail(u.email);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setEmail("");
    setGuestFirstName("");
    setGuestLastName("");
    setGuestPhone("");
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Customer
      </h3>

      {selectedUser ? (
        <div className="rounded-xl border border-border-subtle bg-subtle/50 px-4 py-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-xs font-semibold shrink-0">
            {userInitials(selectedUser)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">
              {userFullName(selectedUser)}
            </p>
            <p className="text-xs text-text-tertiary truncate">
              {selectedUser.email}
              {selectedUser.phone ? ` · ${selectedUser.phone}` : ""}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Registered
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Clear customer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          <div
            className={cn(
              "relative w-full flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2.5 text-sm transition-colors",
              "focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100",
            )}
          >
            <AtSign className="h-4 w-4 text-text-tertiary shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Customer email"
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
              autoComplete="off"
            />
            {isLookingUp && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-text-tertiary" />
            )}
          </div>

          <AnimatePresence>
            {open && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="absolute left-0 right-0 mt-1.5 rounded-lg border border-border-subtle bg-surface shadow-lg shadow-black/10 overflow-hidden z-20"
              >
                <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handlePick(u)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-subtle transition-colors"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[10px] font-semibold shrink-0">
                        {userInitials(u)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary truncate">
                          {userFullName(u)}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                          {u.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Guest-path collection. Phone is required so the BE can reach the
          customer for confirmation. */}
      {isGuestMode && (
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <UserPlus className="h-4 w-4" />
            <p className="text-sm font-semibold">No account for that email</p>
          </div>
          <p className="text-xs text-amber-700/90">
            We&apos;ll save this booking against a guest snapshot. Phone is
            required so we can reach the customer.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={guestFirstName}
              onChange={(e) => setGuestFirstName(e.target.value)}
              placeholder="First name"
              className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <input
              type="text"
              value={guestLastName}
              onChange={(e) => setGuestLastName(e.target.value)}
              placeholder="Last name"
              className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-lg border border-border-default bg-surface pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ProviderPickerProps {
  providers: ServiceProviderSummary[];
  value: string;
  onChange: (id: string) => void;
}

function ProviderPicker({ providers, value, onChange }: ProviderPickerProps) {
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
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? providers.filter((p) => providerLabel(p).toLowerCase().includes(q))
    : providers;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-left transition-colors",
          "hover:border-border-strong focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100",
          open && "border-primary-400 ring-2 ring-primary-100",
        )}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-text-tertiary shrink-0">
          <UserRound className="h-3.5 w-3.5" />
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
          >
            <div className="relative border-b border-border-subtle">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
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
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
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
                      onClick={() => {
                        onChange(p.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-subtle transition-colors",
                        active && "bg-subtle/70",
                      )}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[10px] font-semibold shrink-0">
                        {(p.firstName?.[0] ?? "").toUpperCase()}
                        {(p.lastName?.[0] ?? "").toUpperCase()}
                      </span>
                      <span className="flex-1 truncate text-text-primary">
                        {providerLabel(p)}
                      </span>
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

export function CreateBookingModal({
  businessId,
  open,
  onClose,
  initialDate,
  initialStart,
  initialProviderId,
}: Props) {
  const create = useCreateStaffBooking(businessId);
  const { services } = useBusinessServices(businessId, { page: 1, limit: 100 });

  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserLookupResult | null>(
    null,
  );
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [serviceProviderId, setServiceProviderId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayStr = useMemo(() => todayDateStr(), []);

  // Reset state every time the modal is opened. Pre-fill date / provider
  // from the calendar slot click. We do NOT pre-fill the slot here — it
  // gets matched once the available-slots query resolves.
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setSelectedUser(null);
    setGuestFirstName("");
    setGuestLastName("");
    setGuestPhone("");
    setServiceId("");
    setServiceProviderId(initialProviderId ?? "");
    setDate(initialDate ?? toDateInput(initialStart) ?? "");
    setSlot(null);
    setNotes("");
    setError(null);
  }, [open, initialDate, initialStart, initialProviderId]);

  const selectedService: Service | undefined = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  const showProviderField =
    !!selectedService &&
    selectedService.allowCustomerChooseProvider !== false &&
    (selectedService.providers?.length ?? 0) > 0;

  // If the chosen service doesn't include the pre-selected provider (e.g.
  // calendar pre-fill picked a provider that isn't on the picked service),
  // clear the provider so the BE doesn't reject the payload.
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
    open && serviceId && date
      ? {
          serviceId,
          date,
          serviceProviderId: serviceProviderId || undefined,
        }
      : null,
  );

  const slots = useMemo(() => {
    const payload = slotsQuery.data?.data;
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
    }>;
  }, [slotsQuery.data]);

  // Auto-select the slot from initialStart once it appears in the loaded list.
  useEffect(() => {
    if (!initialStart || slot || slots.length === 0) return;
    const target = new Date(initialStart).getTime();
    const match = slots.find(
      (s) => Math.abs(new Date(s.start).getTime() - target) < 60_000,
    );
    if (match && match.available) {
      setSlot({ start: match.start, end: match.end });
    }
  }, [initialStart, slots, slot]);

  const customerReady = selectedUser
    ? true
    : EMAIL_RE.test(email.trim()) &&
      guestFirstName.trim().length > 0 &&
      guestLastName.trim().length > 0 &&
      guestPhone.trim().length > 0;

  const canSubmit =
    customerReady && !!serviceId && !!slot && !create.isPending;

  const handleSubmit = async () => {
    setError(null);
    if (!customerReady) {
      setError(
        selectedUser
          ? "Pick a customer."
          : "Email, first name, last name, and phone are required for guests.",
      );
      return;
    }
    if (!serviceId) {
      setError("Pick a service.");
      return;
    }
    if (!slot) {
      setError("Pick an available time slot.");
      return;
    }

    const payload: CreateStaffBookingPayload = {
      serviceId,
      bookingTime: slot,
      bookingSource: "CRM",
      ...(serviceProviderId ? { serviceProviderId } : {}),
      ...(notes.trim() ? { customerNotes: notes.trim() } : {}),
      ...(selectedUser
        ? { userId: selectedUser.id }
        : {
            guest: {
              firstName: guestFirstName.trim(),
              lastName: guestLastName.trim(),
              email: email.trim(),
              phone: guestPhone.trim(),
            },
          }),
    };

    try {
      await create.mutateAsync(payload);
      toast.success("Booking created");
      onClose();
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      const text = Array.isArray(message) ? message.join(" ") : message;
      setError(
        typeof text === "string" && text
          ? text
          : "Couldn't create booking. Try again.",
      );
    }
  };

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Fall through to focus when showPicker isn't allowed.
      }
    }
    input.focus();
    input.click();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="create-booking-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="relative bg-surface rounded-2xl shadow-2xl shadow-black/10 max-h-[90vh] flex flex-col overflow-hidden w-full max-w-xl"
        >
          <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <div>
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                New
              </p>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">
                Create booking
              </h2>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
            <CustomerStep
              businessId={businessId}
              email={email}
              setEmail={(v) => {
                setEmail(v);
                if (selectedUser && v.trim().toLowerCase() !== selectedUser.email.toLowerCase()) {
                  setSelectedUser(null);
                }
              }}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              guestFirstName={guestFirstName}
              setGuestFirstName={setGuestFirstName}
              guestLastName={guestLastName}
              setGuestLastName={setGuestLastName}
              guestPhone={guestPhone}
              setGuestPhone={setGuestPhone}
            />

            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Service
              </h3>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    setSlot(null);
                  }}
                  className="w-full appearance-none rounded-lg border border-border-default bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Pick a service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
              </div>
            </div>

            {showProviderField && (
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Provider
                </h3>
                <ProviderPicker
                  providers={selectedService?.providers ?? []}
                  value={serviceProviderId}
                  onChange={(id) => {
                    setServiceProviderId(id);
                    setSlot(null);
                  }}
                />
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Date
              </h3>
              <div
                role="button"
                tabIndex={0}
                onClick={handleOpenDatePicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenDatePicker();
                  }
                }}
                className="relative w-full flex items-center gap-2.5 rounded-lg border border-border-default bg-surface px-3 py-2.5 text-sm cursor-pointer hover:border-border-strong focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors"
              >
                <CalendarIcon className="h-4 w-4 text-text-tertiary shrink-0" />
                <input
                  ref={dateInputRef}
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlot(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-text-primary focus:outline-none"
                />
              </div>
            </div>

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
                        disabled={disabled}
                        onClick={() => setSlot({ start: s.start, end: s.end })}
                        className={cn(
                          "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                          isSelected
                            ? "border-primary-400 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
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

            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Notes
                <span className="ml-1.5 text-[10px] font-normal text-text-tertiary normal-case tracking-normal">
                  (optional)
                </span>
              </h3>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                <textarea
                  rows={3}
                  placeholder="Anything the provider should know."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-border-default bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>

          <div className="flex items-center justify-end px-6 py-4 border-t border-border-subtle bg-subtle/40 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              isLoading={create.isPending}
            >
              Create booking
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
