import type { Booking, BookingStatus, ServiceProvider } from "@/types";

export const START_HOUR = 0;
export const END_HOUR = 24;
export const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
export const HALF_HOURS = Array.from(
  { length: (END_HOUR - START_HOUR) * 2 },
  (_, i) => START_HOUR + i / 2,
);

export const MIN_HOUR_HEIGHT = 32;
export const MAX_HOUR_HEIGHT = 80;
export const DEFAULT_HOUR_HEIGHT = 40;

/** Top padding so the first hour label is not clipped. */
export const GRID_TOP_PADDING = 14;

export const UNASSIGNED_PROVIDER = "__unassigned__";

export const PROVIDER_PALETTE = [
  {
    solid: "rgb(201, 123, 92)",
    soft: "rgb(201, 123, 92, 0.10)",
    line: "rgb(201, 123, 92, 0.22)",
    text: "rgb(140, 76, 50)",
  },
  {
    solid: "rgb(139, 168, 142)",
    soft: "rgba(139, 168, 142, 0.12)",
    line: "rgba(139, 168, 142, 0.25)",
    text: "rgb(85, 119, 90)",
  },
  {
    solid: "rgb(212, 165, 116)",
    soft: "rgba(212, 165, 116, 0.12)",
    line: "rgba(212, 165, 116, 0.26)",
    text: "rgb(149, 110, 65)",
  },
  {
    solid: "rgb(142, 107, 140)",
    soft: "rgba(142, 107, 140, 0.12)",
    line: "rgba(142, 107, 140, 0.25)",
    text: "rgb(99, 71, 99)",
  },
] as const;

export type ProviderTone = (typeof PROVIDER_PALETTE)[number];

export type CalendarViewMode = "day" | "week" | "month";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour;
  return `${display} ${suffix}`;
}

export function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "p" : "a";
  h = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, "0")}${suffix}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfWeek(d: Date): Date {
  const next = startOfDay(d);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekRange(anchor: Date): string {
  const days = getWeekDays(anchor);
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();
  if (sameMonth && sameYear) {
    return `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
  }
  return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

export function getProviderName(provider: ServiceProvider): string {
  if (provider.user) {
    return `${provider.user.firstName ?? ""} ${provider.user.lastName ?? ""}`.trim();
  }
  return `${provider.firstName ?? ""} ${provider.lastName ?? ""}`.trim() || "Provider";
}

export function bookingStatusVariant(
  status: BookingStatus,
): "confirmed" | "tentative" | "completed" | "muted" {
  if (status === "Confirmed") return "confirmed";
  if (status === "Completed") return "completed";
  if (status === "Pending") return "tentative";
  return "muted";
}

export function bookingsForDay(bookings: Booking[], day: Date): Booking[] {
  return bookings.filter((b) => isSameDay(new Date(b.bookingTime.start), day));
}

export function bookingsInRange(bookings: Booking[], start: Date, end: Date): Booking[] {
  const startMs = startOfDay(start).getTime();
  const endMs = startOfDay(end).getTime() + 86400000;
  return bookings.filter((b) => {
    const t = new Date(b.bookingTime.start).getTime();
    return t >= startMs && t < endMs;
  });
}
