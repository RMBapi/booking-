"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User as UserIcon,
  Inbox,
} from "lucide-react";
import { cn } from "@/utils";
import { useGetBookings, useServiceProviders } from "@/features/business-owner";
import type { Booking, ServiceProvider } from "@/types";

const HOUR_HEIGHT = 80;
const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const PASTEL_COLORS = [
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", accent: "bg-rose-200" },
  { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", accent: "bg-sky-200" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", accent: "bg-amber-200" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", accent: "bg-emerald-200" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", accent: "bg-violet-200" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-700", accent: "bg-fuchsia-200" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", accent: "bg-teal-200" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", accent: "bg-orange-200" },
];

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display} ${suffix}`;
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
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

interface BookingCardProps {
  booking: Booking;
  colorScheme: (typeof PASTEL_COLORS)[number];
}

function BookingCard({ booking, colorScheme }: BookingCardProps) {
  const start = new Date(booking.bookingTime.start);
  const end = new Date(booking.bookingTime.end);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const durationMinutes = endMinutes - startMinutes;

  const topOffset = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT - 4, 28);

  const cust = booking.user || booking.customer;
  const customerName = cust
    ? `${cust.firstName} ${cust.lastName}`
    : "Customer";
  const serviceName = booking.service?.name ?? "Service";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "absolute left-1 right-1 rounded-xl border px-3 py-2 overflow-hidden cursor-pointer",
        "hover:shadow-md transition-shadow",
        colorScheme.bg,
        colorScheme.border
      )}
      style={{ top: `${topOffset}px`, height: `${height}px` }}
    >
      <p className={cn("text-xs font-semibold truncate", colorScheme.text)}>
        {customerName}
      </p>
      {height > 40 && (
        <p className={cn("text-[11px] truncate mt-0.5 opacity-80", colorScheme.text)}>
          {serviceName}
        </p>
      )}
      {height > 56 && (
        <p className={cn("text-[10px] mt-0.5 opacity-60", colorScheme.text)}>
          {formatTimeShort(booking.bookingTime.start)} – {formatTimeShort(booking.bookingTime.end)}
        </p>
      )}
    </motion.div>
  );
}

function CurrentTimeLine() {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-[2px] bg-red-500 opacity-60" />
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);

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

  const visibleProviders = useMemo(() => {
    if (!providers.length) return [];
    if (activeProviderId) return providers.filter((p) => p.id === activeProviderId);
    return providers;
  }, [providers, activeProviderId]);

  const dayBookings = useMemo(() => {
    return bookings.filter((b) => isSameDay(new Date(b.bookingTime.start), selectedDate));
  }, [bookings, selectedDate]);

  const bookingsByProvider = useMemo(() => {
    const map = new Map<string, Booking[]>();
    visibleProviders.forEach((p) => map.set(p.id, []));

    dayBookings.forEach((b) => {
      const providerBookings = map.get(b.serviceProviderId);
      if (providerBookings) {
        providerBookings.push(b);
      }
    });

    return map;
  }, [dayBookings, visibleProviders]);

  const providerColorMap = useMemo(() => {
    const map = new Map<string, (typeof PASTEL_COLORS)[number]>();
    providers.forEach((p, i) => {
      map.set(p.id, PASTEL_COLORS[i % PASTEL_COLORS.length]);
    });
    return map;
  }, [providers]);

  const isLoading = bookingsLoading || providersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Clock className="w-8 h-8 text-stone-400" />
        </motion.div>
      </div>
    );
  }

  if (!providers.length) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            No service providers yet
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Add service providers to your business first, then their bookings will appear here on the calendar.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#FDFCFB]/95 backdrop-blur-sm border-b border-stone-200">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
                isToday
                  ? "bg-stone-800 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              )}
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-stone-600" />
              </button>
              <button
                onClick={goNext}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-stone-600" />
              </button>
            </div>
          </div>

          <h1 className="text-base md:text-lg font-semibold text-stone-800">
            {formatDateHeader(selectedDate)}
          </h1>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-stone-400" />
            <span className="text-sm text-stone-500 hidden sm:inline">Day View</span>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveProviderId(null)}
            className={cn(
              "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              !activeProviderId
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-50"
            )}
          >
            All
          </button>
          {providers.map((provider) => {
            const name = getProviderName(provider);
            const initials = getInitials(
              provider.user?.firstName ?? provider.firstName,
              provider.user?.lastName ?? provider.lastName
            );
            const isActive = activeProviderId === provider.id;
            const color = providerColorMap.get(provider.id)!;

            return (
              <button
                key={provider.id}
                onClick={() => setActiveProviderId(isActive ? null : provider.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-stone-800 text-white"
                    : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-50"
                )}
              >
                {provider.impUrl ? (
                  <img
                    src={provider.impUrl}
                    alt={name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      isActive ? "bg-white/20 text-white" : cn(color.accent, color.text)
                    )}
                  >
                    {initials}
                  </span>
                )}
                <span className="hidden sm:inline">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div
          className="min-w-[600px]"
          style={{ minWidth: `${Math.max(visibleProviders.length * 200, 600)}px` }}
        >
          {/* Provider Column Headers */}
          <div className="sticky top-[120px] z-20 bg-[#FDFCFB]/95 backdrop-blur-sm border-b border-stone-200">
            <div className="flex">
              <div className="w-20 shrink-0" />
              {visibleProviders.map((provider) => {
                const name = getProviderName(provider);
                const initials = getInitials(
                  provider.user?.firstName ?? provider.firstName,
                  provider.user?.lastName ?? provider.lastName
                );
                const color = providerColorMap.get(provider.id)!;
                const count = bookingsByProvider.get(provider.id)?.length ?? 0;

                return (
                  <div
                    key={provider.id}
                    className="flex-1 min-w-[180px] px-3 py-3 flex items-center gap-2.5 border-l border-stone-100"
                  >
                    {provider.impUrl ? (
                      <img
                        src={provider.impUrl}
                        alt={name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white",
                          color.accent,
                          color.text
                        )}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">{name}</p>
                      <p className="text-[11px] text-stone-400">
                        {count} booking{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Grid */}
          <div className="relative flex">
            {/* Time Labels */}
            <div className="w-20 shrink-0">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b border-stone-100"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="absolute -top-2.5 right-3 text-[11px] font-medium text-stone-400">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Provider Columns */}
            {visibleProviders.map((provider) => {
              const color = providerColorMap.get(provider.id)!;
              const providerBookings = bookingsByProvider.get(provider.id) ?? [];

              return (
                <div
                  key={provider.id}
                  className="flex-1 min-w-[180px] relative border-l border-stone-100"
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-stone-100 border-dashed"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}

                  <AnimatePresence>
                    {providerBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        colorScheme={color}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Current time indicator */}
            {isToday && <CurrentTimeLine />}
          </div>
        </div>
      </div>

      {/* Day summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 md:px-8 py-4 border-t border-stone-200 bg-[#FDFCFB]"
      >
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span>
            <strong className="text-stone-700">{dayBookings.length}</strong> booking{dayBookings.length !== 1 ? "s" : ""} today
          </span>
          <span className="text-stone-300">•</span>
          <span>
            <strong className="text-stone-700">{visibleProviders.length}</strong> provider{visibleProviders.length !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
