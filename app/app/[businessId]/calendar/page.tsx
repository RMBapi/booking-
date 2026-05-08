"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Inbox,
  Search,
  Plus,
  Minus,
  Filter,
  X,
  Calendar as CalendarIcon,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils";
import {
  CreateBookingModal,
  useGetBookings,
  useServiceProviders,
} from "@/features/business-owner";
import type { Booking, BookingStatus, ServiceProvider } from "@/types";

const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const HALF_HOURS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => START_HOUR + i / 2);

const MIN_HOUR_HEIGHT = 60;
const MAX_HOUR_HEIGHT = 120;
const DEFAULT_HOUR_HEIGHT = 88;
const ZOOM_KEY = "calendarHourHeight";

// Curated 4-tone palette — saturation cycles per provider so colors stay disciplined.
const PROVIDER_PALETTE = [
  { name: "clay", solid: "rgb(201, 123, 92)", soft: "rgb(201, 123, 92, 0.10)", line: "rgb(201, 123, 92, 0.22)", text: "rgb(140, 76, 50)" },
  { name: "sage", solid: "rgb(139, 168, 142)", soft: "rgba(139, 168, 142, 0.12)", line: "rgba(139, 168, 142, 0.25)", text: "rgb(85, 119, 90)" },
  { name: "gold", solid: "rgb(212, 165, 116)", soft: "rgba(212, 165, 116, 0.12)", line: "rgba(212, 165, 116, 0.26)", text: "rgb(149, 110, 65)" },
  { name: "plum", solid: "rgb(142, 107, 140)", soft: "rgba(142, 107, 140, 0.12)", line: "rgba(142, 107, 140, 0.25)", text: "rgb(99, 71, 99)" },
];
type Tone = (typeof PROVIDER_PALETTE)[number];

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display} ${suffix}`;
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "p" : "a";
  h = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, "0")}${suffix}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function getProviderName(provider: ServiceProvider): string {
  if (provider.user) {
    return `${provider.user.firstName ?? ""} ${provider.user.lastName ?? ""}`.trim();
  }
  return `${provider.firstName ?? ""} ${provider.lastName ?? ""}`.trim() || "Provider";
}

function bookingStatusVariant(status: BookingStatus): "confirmed" | "tentative" | "blocked" | "muted" {
  if (status === "Confirmed" || status === "Completed") return "confirmed";
  if (status === "Pending") return "tentative";
  if (status === "Cancelled") return "muted";
  return "confirmed";
}

/* ─────────────── BOOKING BLOCK ─────────────── */

interface BookingCardProps {
  booking: Booking;
  tone: Tone;
  hourHeight: number;
}

function BookingCard({ booking, tone, hourHeight }: BookingCardProps) {
  const start = new Date(booking.bookingTime.start);
  const end = new Date(booking.bookingTime.end);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const durationMinutes = endMinutes - startMinutes;

  const topOffset = ((startMinutes - START_HOUR * 60) / 60) * hourHeight;
  const height = Math.max((durationMinutes / 60) * hourHeight - 4, 32);

  const cust = booking.user || booking.customer;
  const customerName = cust ? `${cust.firstName} ${cust.lastName}` : "Customer";
  const serviceName = booking.service?.name ?? "Service";
  const variant = bookingStatusVariant(booking.status);

  const baseStyle: React.CSSProperties = {
    top: `${topOffset}px`,
    height: `${height}px`,
    borderLeft: `3px solid ${tone.solid}`,
  };

  const variantStyle: React.CSSProperties =
    variant === "confirmed"
      ? { background: tone.soft, color: tone.text, borderColor: tone.line, borderLeftColor: tone.solid }
      : variant === "muted"
      ? { background: "transparent", color: "var(--color-text-tertiary)", borderColor: "var(--color-border-subtle)", borderLeftColor: tone.line, opacity: 0.55 }
      : { background: tone.soft, color: tone.text, borderColor: tone.line, borderLeftColor: tone.solid };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      className={cn(
        "absolute left-1.5 right-1.5 rounded-lg border px-2.5 py-1.5 overflow-hidden cursor-pointer group",
        variant === "tentative" && "stripe-soft",
        variant === "muted" && "border-dashed line-through",
      )}
      style={{ ...baseStyle, ...variantStyle }}
    >
      <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: tone.text }}>
        {customerName}
      </p>
      {height > 44 && (
        <p className="text-[11px] truncate mt-0.5 leading-tight" style={{ color: "var(--color-text-tertiary)" }}>
          {serviceName}
        </p>
      )}
      {height > 64 && (
        <span
          className="absolute bottom-1 right-1.5 text-[10px] font-medium tabular px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(255,255,255,0.7)", color: tone.text }}
        >
          {formatTimeShort(booking.bookingTime.start)}–{formatTimeShort(booking.bookingTime.end)}
        </span>
      )}
    </motion.div>
  );
}

/* ─────────────── NOW INDICATOR ─────────────── */

function CurrentTimeLine({ hourHeight }: { hourHeight: number }) {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = ((minutes - START_HOUR * 60) / 60) * hourHeight;

  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <span className="relative ml-[-5px] h-2.5 w-2.5 rounded-full bg-rose-500 ring-pulse shrink-0" />
        <div className="flex-1 h-px bg-gradient-to-r from-rose-500 via-rose-500/40 to-transparent" />
      </div>
    </div>
  );
}

/* ─────────────── MAIN PAGE ─────────────── */

export default function CalendarPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [providerSearch, setProviderSearch] = useState("");
  const [filterRailOpen, setFilterRailOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hourHeight, setHourHeight] = useState(DEFAULT_HOUR_HEIGHT);
  const [createBooking, setCreateBooking] = useState<
    { date?: string; start?: string; providerId?: string } | null
  >(null);

  // Restore zoom from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ZOOM_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_HOUR_HEIGHT && parsed <= MAX_HOUR_HEIGHT) {
        setHourHeight(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ZOOM_KEY, String(hourHeight));
  }, [hourHeight]);

  const { bookings, isLoading: bookingsLoading } = useGetBookings(businessId);
  const { providers, isLoading: providersLoading } = useServiceProviders(businessId, {});

  const isToday = isSameDay(selectedDate, new Date());

  const goToToday = () => setSelectedDate(new Date());
  const goPrev = () =>
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      return next;
    });
  const goNext = () =>
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });

  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return providers;
    const q = providerSearch.toLowerCase();
    return providers.filter((p) => getProviderName(p).toLowerCase().includes(q));
  }, [providers, providerSearch]);

  const visibleProviders = useMemo(() => {
    if (!filteredProviders.length) return [];
    if (activeProviderId) return filteredProviders.filter((p) => p.id === activeProviderId);
    return filteredProviders;
  }, [filteredProviders, activeProviderId]);

  const dayBookings = useMemo(() => {
    return bookings.filter((b) => isSameDay(new Date(b.bookingTime.start), selectedDate));
  }, [bookings, selectedDate]);

  const bookingsByProvider = useMemo(() => {
    const map = new Map<string, Booking[]>();
    visibleProviders.forEach((p) => map.set(p.id, []));

    dayBookings.forEach((b) => {
      const providerBookings = map.get(b.serviceProviderId);
      if (providerBookings) providerBookings.push(b);
    });

    return map;
  }, [dayBookings, visibleProviders]);

  const providerToneMap = useMemo(() => {
    const map = new Map<string, Tone>();
    providers.forEach((p, i) => {
      map.set(p.id, PROVIDER_PALETTE[i % PROVIDER_PALETTE.length]);
    });
    return map;
  }, [providers]);

  const totalUtilizationPct = useMemo(() => {
    if (!visibleProviders.length) return 0;
    const workingMinutes = (END_HOUR - START_HOUR) * 60 * visibleProviders.length;
    const bookedMinutes = dayBookings.reduce((sum, b) => {
      const s = new Date(b.bookingTime.start);
      const e = new Date(b.bookingTime.end);
      return sum + (e.getTime() - s.getTime()) / 60000;
    }, 0);
    return Math.min(100, Math.round((bookedMinutes / workingMinutes) * 100));
  }, [dayBookings, visibleProviders]);

  const nextSlotLabel = useMemo(() => {
    if (!isToday) return "Tomorrow 8am";
    const now = new Date();
    const upcoming = dayBookings
      .map((b) => new Date(b.bookingTime.start))
      .filter((d) => d.getTime() > now.getTime())
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (!upcoming) return "No more bookings";
    return formatTimeShort(upcoming.toISOString());
  }, [dayBookings, isToday]);

  const isLoading = bookingsLoading || providersLoading;

  // Build a CreateBookingModal prefill from a calendar half-hour click.
  // The chosen `start` is in the local timezone of the browser — that
  // matches how the calendar plots bookings, so the modal will line up
  // with what the user clicked. If no providers exist yet, fall through
  // to the empty-state view above so this is never reached.
  const handleSlotClick = (providerId: string, halfHour: number) => {
    const d = new Date(selectedDate);
    const hour = Math.floor(halfHour);
    const minute = halfHour % 1 ? 30 : 0;
    d.setHours(hour, minute, 0, 0);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setCreateBooking({ date: dateStr, start: d.toISOString(), providerId });
  };

  const handleNewBookingClick = () => {
    const d = new Date(selectedDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setCreateBooking({ date: dateStr });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
          className="text-text-tertiary"
        >
          <Clock className="w-7 h-7" />
        </motion.div>
      </div>
    );
  }

  if (!providers.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-border-subtle flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-6 h-6 text-text-tertiary" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            No service providers yet
          </h2>
          <p className="text-sm text-text-tertiary leading-relaxed mt-1.5">
            Add providers to your business and their bookings will appear here on the calendar.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="-mx-4 lg:-mx-8 -my-6 lg:-my-10 flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Top header row */}
      <header className="sticky top-14 z-20 bg-canvas/85 backdrop-blur-xl border-b border-border-subtle">
        <div className="flex items-center justify-between gap-3 px-4 lg:px-8 h-14">
          <div className="flex items-center gap-2.5">
            <button
              onClick={goToToday}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                isToday
                  ? "bg-text-primary text-white"
                  : "bg-surface text-text-secondary border border-border-subtle hover:border-border-default",
              )}
            >
              Today
            </button>
            <div className="flex items-center bg-surface border border-border-subtle rounded-lg overflow-hidden">
              <button
                onClick={goPrev}
                className="px-2 py-1.5 hover:bg-subtle transition-colors text-text-secondary"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-px h-5 bg-border-subtle" />
              <button
                onClick={goNext}
                className="px-2 py-1.5 hover:bg-subtle transition-colors text-text-secondary"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setDatePickerOpen((s) => !s)}
                className="ml-1 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-subtle transition-colors text-text-primary font-semibold tracking-tight"
              >
                <span className="text-sm md:text-base">{formatDateHeader(selectedDate)}</span>
                <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
              </button>
              <AnimatePresence>
                {datePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14 }}
                    className="absolute left-0 mt-2 w-72 bg-surface border border-border-subtle rounded-xl shadow-lg z-30 p-3"
                    onMouseLeave={() => setDatePickerOpen(false)}
                  >
                    <DatePickerPopover value={selectedDate} onSelect={(d) => { setSelectedDate(d); setDatePickerOpen(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewBookingClick}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-text-primary text-white text-sm font-medium hover:bg-text-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New booking</span>
            </button>

            {/* View segmented control */}
            <SegmentedView value={view} onChange={setView} />

            {/* Zoom */}
            <div className="hidden md:flex items-center bg-surface border border-border-subtle rounded-lg overflow-hidden">
              <button
                onClick={() => setHourHeight((h) => Math.max(MIN_HOUR_HEIGHT, h - 12))}
                className="px-2 py-1.5 hover:bg-subtle transition-colors text-text-secondary disabled:opacity-30"
                disabled={hourHeight <= MIN_HOUR_HEIGHT}
                aria-label="Zoom out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-5 bg-border-subtle" />
              <button
                onClick={() => setHourHeight((h) => Math.min(MAX_HOUR_HEIGHT, h + 12))}
                className="px-2 py-1.5 hover:bg-subtle transition-colors text-text-secondary disabled:opacity-30"
                disabled={hourHeight >= MAX_HOUR_HEIGHT}
                aria-label="Zoom in"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex h-9 px-3 items-center gap-1.5 rounded-lg bg-surface border border-border-subtle text-sm text-text-secondary"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>

            {/* Desktop rail toggle */}
            <button
              onClick={() => setFilterRailOpen((s) => !s)}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-border-subtle text-text-secondary hover:bg-subtle transition-colors"
              aria-label="Toggle providers"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body: filter rail + grid */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop filter rail */}
        <AnimatePresence initial={false}>
          {filterRailOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="hidden lg:block shrink-0 border-r border-border-subtle bg-surface/40 backdrop-blur-sm overflow-hidden"
            >
              <ProviderRail
                providers={providers}
                filtered={filteredProviders}
                activeProviderId={activeProviderId}
                onSetActive={setActiveProviderId}
                providerSearch={providerSearch}
                setProviderSearch={setProviderSearch}
                providerToneMap={providerToneMap}
                bookingsByProvider={bookingsByProvider}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile filter sheet */}
        <AnimatePresence>
          {mobileFilterOpen && (
            <motion.div
              className="fixed inset-0 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setMobileFilterOpen(false)} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
                className="absolute inset-x-0 bottom-0 bg-surface rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                  <h3 className="text-sm font-semibold text-text-primary">Providers</h3>
                  <button onClick={() => setMobileFilterOpen(false)} className="text-text-tertiary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ProviderRail
                    providers={providers}
                    filtered={filteredProviders}
                    activeProviderId={activeProviderId}
                    onSetActive={(id) => { setActiveProviderId(id); setMobileFilterOpen(false); }}
                    providerSearch={providerSearch}
                    setProviderSearch={setProviderSearch}
                    providerToneMap={providerToneMap}
                    bookingsByProvider={bookingsByProvider}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div style={{ minWidth: `${Math.max(visibleProviders.length * 200 + 80, 600)}px` }}>
            {/* Provider column headers */}
            <div className="sticky top-[7rem] z-10 bg-canvas/85 backdrop-blur-xl border-b border-border-subtle">
              <div className="flex">
                <div className="w-20 shrink-0" />
                {visibleProviders.map((provider) => {
                  const name = getProviderName(provider);
                  const initials = getInitials(
                    provider.user?.firstName ?? provider.firstName,
                    provider.user?.lastName ?? provider.lastName,
                  );
                  const tone = providerToneMap.get(provider.id)!;
                  const count = bookingsByProvider.get(provider.id)?.length ?? 0;
                  const utilization = Math.min(100, count * 12);
                  return (
                    <div
                      key={provider.id}
                      className="flex-1 min-w-[180px] px-3 py-3 border-l border-border-subtle group"
                    >
                      <div className="flex items-center gap-2.5">
                        {provider.impUrl ? (
                          <img
                            src={provider.impUrl}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-surface transition-transform duration-200 group-hover:scale-110"
                            style={{ boxShadow: `0 0 0 2px ${tone.line}` }}
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ring-2 ring-surface transition-transform duration-200 group-hover:scale-110"
                            style={{ background: tone.soft, color: tone.text, boxShadow: `0 0 0 2px ${tone.line}` }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary truncate tracking-tight">{name}</p>
                          <p className="text-[11px] text-text-tertiary tabular">
                            {count} booking{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-subtle overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${utilization}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{ background: tone.solid, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time grid */}
            <div className="relative flex">
              {/* Time labels */}
              <div className="w-20 shrink-0">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="relative border-b border-border-subtle"
                    style={{ height: `${hourHeight}px` }}
                  >
                    <span className="absolute -top-2 right-3 text-[11px] font-medium text-text-tertiary tabular">
                      {formatHour(hour)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Provider columns */}
              {visibleProviders.map((provider) => {
                const tone = providerToneMap.get(provider.id)!;
                const providerBookings = bookingsByProvider.get(provider.id) ?? [];

                return (
                  <ProviderColumn
                    key={provider.id}
                    tone={tone}
                    bookings={providerBookings}
                    hourHeight={hourHeight}
                    onSlotClick={(h) => handleSlotClick(provider.id, h)}
                  />
                );
              })}

              {/* Now indicator */}
              {isToday && <CurrentTimeLine hourHeight={hourHeight} />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0 z-10 bg-surface/80 backdrop-blur-xl border-t border-border-subtle px-4 lg:px-8 py-2.5"
      >
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <StatusChip icon={<TrendingUp className="w-3 h-3" />} label="Utilization" value={`${totalUtilizationPct}%`} />
          <StatusChip icon={<CalendarIcon className="w-3 h-3" />} label="Bookings" value={`${dayBookings.length}`} />
          <StatusChip label="Providers" value={`${visibleProviders.length}`} />
          <StatusChip label="Next" value={nextSlotLabel} />
        </div>
      </motion.div>

      <CreateBookingModal
        businessId={businessId}
        open={!!createBooking}
        onClose={() => setCreateBooking(null)}
        initialDate={createBooking?.date}
        initialStart={createBooking?.start}
        initialProviderId={createBooking?.providerId}
      />
    </div>
  );
}

/* ─────────────── PROVIDER COLUMN (with hover ghost) ─────────────── */

function ProviderColumn({
  tone,
  bookings,
  hourHeight,
  onSlotClick,
}: {
  tone: Tone;
  bookings: Booking[];
  hourHeight: number;
  onSlotClick: (halfHour: number) => void;
}) {
  const [hoverHalfHour, setHoverHalfHour] = useState<number | null>(null);

  return (
    <div
      className="flex-1 min-w-[180px] relative border-l border-border-subtle"
      onMouseLeave={() => setHoverHalfHour(null)}
    >
      {/* Hour grid lines */}
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="border-b border-border-subtle"
          style={{ height: `${hourHeight}px` }}
        />
      ))}
      {/* Half-hour faint marks */}
      {HOURS.map((hour) => (
        <div
          key={`half-${hour}`}
          className="absolute left-0 right-0 border-b border-dashed border-border-subtle/60"
          style={{ top: `${((hour - START_HOUR) + 0.5) * hourHeight}px`, height: 0 }}
          aria-hidden
        />
      ))}

      {/* Click targets — half-hour resolution. The ghost block above is
          purely visual; the actual hit area is here so a click anywhere on
          a half-hour row opens the booking modal pre-filled to that slot. */}
      <div className="absolute inset-0 z-0">
        {HALF_HOURS.map((h) => (
          <button
            type="button"
            key={h}
            className="absolute left-0 right-0 cursor-pointer"
            style={{
              top: `${(h - START_HOUR) * hourHeight}px`,
              height: `${hourHeight / 2}px`,
            }}
            onMouseEnter={() => setHoverHalfHour(h)}
            onClick={() => onSlotClick(h)}
            aria-label={`Create booking at ${Math.floor(h)}:${h % 1 ? "30" : "00"}`}
          />
        ))}
      </div>

      {/* Hover ghost block */}
      {hoverHalfHour !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-1.5 right-1.5 z-[1] rounded-lg border border-dashed pointer-events-none flex items-center justify-center text-[11px] font-medium"
          style={{
            top: `${(hoverHalfHour - START_HOUR) * hourHeight + 1}px`,
            height: `${hourHeight / 2 - 2}px`,
            borderColor: tone.line,
            background: tone.soft,
            color: tone.text,
          }}
        >
          + New booking · {formatHour(Math.floor(hoverHalfHour))}{hoverHalfHour % 1 ? ":30" : ":00"}
        </motion.div>
      )}

      <AnimatePresence>
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            tone={tone}
            hourHeight={hourHeight}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── PROVIDER RAIL ─────────────── */

function ProviderRail({
  providers,
  filtered,
  activeProviderId,
  onSetActive,
  providerSearch,
  setProviderSearch,
  providerToneMap,
  bookingsByProvider,
}: {
  providers: ServiceProvider[];
  filtered: ServiceProvider[];
  activeProviderId: string | null;
  onSetActive: (id: string | null) => void;
  providerSearch: string;
  setProviderSearch: (s: string) => void;
  providerToneMap: Map<string, Tone>;
  bookingsByProvider: Map<string, Booking[]>;
}) {
  return (
    <div className="w-[240px] flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            value={providerSearch}
            onChange={(e) => setProviderSearch(e.target.value)}
            placeholder="Search providers"
            className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg bg-canvas border border-border-subtle focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        </div>
      </div>
      <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        <span>Providers</span>
        <button
          onClick={() => onSetActive(null)}
          className={cn(
            "text-[11px] font-medium normal-case tracking-normal transition-colors",
            !activeProviderId ? "text-primary-700" : "text-text-tertiary hover:text-text-primary",
          )}
        >
          Show all
        </button>
      </div>
      <LayoutGroup id="provider-rail">
        <ul className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {filtered.map((p) => {
            const name = getProviderName(p);
            const initials = getInitials(
              p.user?.firstName ?? p.firstName,
              p.user?.lastName ?? p.lastName,
            );
            const isActive = activeProviderId === p.id;
            const tone = providerToneMap.get(p.id)!;
            const count = bookingsByProvider.get(p.id)?.length ?? 0;
            return (
              <li key={p.id}>
                <button
                  onClick={() => onSetActive(isActive ? null : p.id)}
                  className={cn(
                    "relative w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
                    isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="rail-active"
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      className="absolute inset-0 rounded-lg bg-subtle"
                    />
                  )}
                  {p.impUrl ? (
                    <img
                      src={p.impUrl}
                      alt={name}
                      className="relative z-10 w-6 h-6 rounded-full object-cover"
                      style={{ boxShadow: `0 0 0 1.5px ${tone.line}` }}
                    />
                  ) : (
                    <span
                      className="relative z-10 inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold"
                      style={{ background: tone.soft, color: tone.text, boxShadow: `0 0 0 1.5px ${tone.line}` }}
                    >
                      {initials}
                    </span>
                  )}
                  <span className="relative z-10 truncate flex-1 font-medium">{name}</span>
                  <span className="relative z-10 text-[11px] text-text-tertiary tabular">{count}</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="text-[11px] text-text-tertiary text-center py-4">No matches</li>
          )}
        </ul>
      </LayoutGroup>
      <div className="border-t border-border-subtle px-3 py-2.5">
        <p className="text-[11px] text-text-tertiary">
          {providers.length} provider{providers.length !== 1 ? "s" : ""} total
        </p>
      </div>
    </div>
  );
}

/* ─────────────── SEGMENTED VIEW SWITCHER ─────────────── */

function SegmentedView({
  value,
  onChange,
}: {
  value: "day" | "week" | "month";
  onChange: (v: "day" | "week" | "month") => void;
}) {
  const items: Array<{ k: "day" | "week" | "month"; label: string; disabled?: boolean }> = [
    { k: "day", label: "Day" },
    { k: "week", label: "Week", disabled: true },
    { k: "month", label: "Month", disabled: true },
  ];
  return (
    <LayoutGroup id="seg-view">
      <div className="hidden md:inline-flex bg-surface border border-border-subtle rounded-lg p-0.5 relative">
        {items.map((item) => {
          const active = value === item.k;
          return (
            <button
              key={item.k}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.k)}
              className={cn(
                "relative px-3 py-1 text-xs font-medium rounded-md transition-colors",
                active ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
                item.disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {active && (
                <motion.span
                  layoutId="seg-active"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-subtle"
                />
              )}
              <span className="relative z-10">{item.label}</span>
              {item.disabled && (
                <span className="relative z-10 ml-1 text-[9px] uppercase tracking-wider text-text-quaternary">soon</span>
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ─────────────── DATE PICKER POPOVER ─────────────── */

function DatePickerPopover({ value, onSelect }: { value: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startWeekday = first.getDay();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return cells;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-subtle text-text-secondary"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm font-semibold text-text-primary">{monthLabel}</span>
        <button
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-subtle text-text-secondary"
          aria-label="Next month"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-center font-medium py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => {
          if (!d) return <span key={i} />;
          const selected = isSameDay(d, value);
          const today = isSameDay(d, new Date());
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className={cn(
                "h-8 text-xs tabular rounded-md transition-colors",
                selected
                  ? "bg-text-primary text-white font-semibold"
                  : today
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-text-secondary hover:bg-subtle",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── STATUS CHIP ─────────────── */

function StatusChip({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-subtle border border-border-subtle text-text-secondary">
      {icon && <span className="text-text-tertiary">{icon}</span>}
      <span className="text-text-tertiary">{label}</span>
      <span className="font-semibold text-text-primary tabular">{value}</span>
    </span>
  );
}
