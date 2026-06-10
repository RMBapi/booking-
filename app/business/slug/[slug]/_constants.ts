import type { Variants } from "framer-motion";
import type { DayKey, DayOpeningHours, OpeningHours } from "@/types";

export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: EASE_OUT_QUART },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_QUART },
  },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_QUART },
  },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_QUART },
  },
};

export const VP = { once: true, amount: 0.2 as const };

export const SERVICE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1606333259737-6da197890fa2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1543697506-6729425f7265?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  "https://images.unsplash.com/photo-1604368640692-027f44ffb8cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
];

/** Fallback shown only when the business has no dynamic `openingHours` configured. */
export const OPERATING_HOURS = [
  { day: "Monday", hours: "7:00 AM – 6:00 PM" },
  { day: "Tuesday", hours: "7:00 AM – 6:00 PM" },
  { day: "Wednesday", hours: "7:00 AM – 6:00 PM" },
  { day: "Thursday", hours: "7:00 AM – 7:00 PM" },
  { day: "Friday", hours: "7:00 AM – 6:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

export const DAY_ORDER: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** Convert a 24-hour "HH:mm" string into a 12-hour "h:mm AM/PM" label. */
function formatTime24to12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

export function formatOpeningHoursRow(day: DayOpeningHours): string {
  if (!day?.isOpen || !day.open || !day.close) return "Closed";
  return `${formatTime24to12(day.open)} – ${formatTime24to12(day.close)}`;
}

/**
 * Build the display rows from a business's dynamic `openingHours`.
 * Returns the hardcoded fallback when hours haven't been configured (null).
 */
export function buildOpeningHoursRows(
  openingHours: OpeningHours | null | undefined,
): { day: string; hours: string }[] {
  if (!openingHours) return OPERATING_HOURS;
  return DAY_ORDER.map((key) => ({
    day: DAY_LABELS[key],
    hours: formatOpeningHoursRow(openingHours[key]),
  }));
}

export const DAY_SHORT: Record<DayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** Raw 24h fallback (mirrors OPERATING_HOURS) used when no hours are configured. */
const FALLBACK_HOURS: Record<DayKey, DayOpeningHours> = {
  monday: { isOpen: true, open: "07:00", close: "18:00" },
  tuesday: { isOpen: true, open: "07:00", close: "18:00" },
  wednesday: { isOpen: true, open: "07:00", close: "18:00" },
  thursday: { isOpen: true, open: "07:00", close: "19:00" },
  friday: { isOpen: true, open: "07:00", close: "18:00" },
  saturday: { isOpen: false },
  sunday: { isOpen: false },
};

/** Minutes since midnight for a 24h "HH:mm" string, or null if unparseable. */
function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export interface OpeningHoursDay {
  key: DayKey;
  /** Three-letter label, e.g. "Mon". */
  short: string;
  /** Full label, e.g. "Monday". */
  label: string;
  /** 0 = Monday … 6 = Sunday (matches DAY_ORDER). */
  index: number;
  isOpen: boolean;
  /** 12h display, e.g. "9:00 AM" — null when closed. */
  open: string | null;
  close: string | null;
  /** Minutes since midnight for open/close — null when closed. */
  openMin: number | null;
  closeMin: number | null;
}

/**
 * Structured weekly schedule (Mon→Sun) for the opening-hours strip. Includes
 * both display labels and raw minutes so callers can compute a live
 * "open now / closed" status against the current time.
 */
export function buildOpeningHoursWeek(
  openingHours: OpeningHours | null | undefined,
): OpeningHoursDay[] {
  const source = openingHours ?? FALLBACK_HOURS;
  return DAY_ORDER.map((key, index) => {
    const day = source[key];
    const isOpen = !!(day?.isOpen && day.open && day.close);
    return {
      key,
      short: DAY_SHORT[key],
      label: DAY_LABELS[key],
      index,
      isOpen,
      open: isOpen ? formatTime24to12(day.open as string) : null,
      close: isOpen ? formatTime24to12(day.close as string) : null,
      openMin: isOpen ? toMinutes(day.open) : null,
      closeMin: isOpen ? toMinutes(day.close) : null,
    };
  });
}
