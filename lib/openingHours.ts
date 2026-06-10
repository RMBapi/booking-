import type { DayKey, DayOpeningHours, OpeningHours } from "@/types";

/**
 * Opening hours helpers — pure, framework-agnostic. The API stores times as
 * 24-hour "HH:mm" and expects all seven days when `openingHours` is sent. See
 * docs: per-business weekly schedule on the business row (JSONB).
 */

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

/** 24-hour HH:mm — leading-zero hours and minutes, e.g. "07:00", "19:30". */
const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string | undefined): value is string {
  return typeof value === "string" && TIME_24H_REGEX.test(value);
}

/** "07:00" → "7:00 AM", "19:30" → "7:30 PM". Returns input as-is if malformed. */
export function formatTime24to12(hhmm: string): string {
  const match = TIME_24H_REGEX.exec(hhmm);
  if (!match) return hhmm;
  let h = parseInt(match[1], 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${match[2]} ${suffix}`;
}

/** One-line summary for a day, e.g. "7:00 AM – 6:00 PM" or "Closed". */
export function formatOpeningHoursRow(day: DayOpeningHours): string {
  if (!day.isOpen || !day.open || !day.close) return "Closed";
  return `${formatTime24to12(day.open)} – ${formatTime24to12(day.close)}`;
}

/** Default form state when `openingHours` is null: Mon–Fri open, weekend closed. */
export function defaultOpeningHours(): OpeningHours {
  const weekday: DayOpeningHours = { isOpen: true, open: "09:00", close: "17:00" };
  const closed: DayOpeningHours = { isOpen: false };
  return {
    monday: { ...weekday },
    tuesday: { ...weekday },
    wednesday: { ...weekday },
    thursday: { ...weekday },
    friday: { ...weekday },
    saturday: { ...closed },
    sunday: { ...closed },
  };
}

/**
 * Normalise possibly-partial API data into a full seven-day object suitable for
 * editing. Missing days fall back to closed; open days keep their times.
 */
export function hydrateOpeningHours(
  source: OpeningHours | null | undefined,
): OpeningHours {
  if (!source) return defaultOpeningHours();
  const result = {} as OpeningHours;
  for (const day of DAY_ORDER) {
    const value = source[day];
    if (value?.isOpen) {
      result[day] = {
        isOpen: true,
        open: value.open ?? "09:00",
        close: value.close ?? "17:00",
      };
    } else {
      result[day] = { isOpen: false };
    }
  }
  return result;
}

/**
 * Build the API payload: drop open/close on closed days, keep all seven days.
 * Call after validation passes.
 */
export function toOpeningHoursPayload(hours: OpeningHours): OpeningHours {
  const result = {} as OpeningHours;
  for (const day of DAY_ORDER) {
    const value = hours[day];
    result[day] = value.isOpen
      ? { isOpen: true, open: value.open, close: value.close }
      : { isOpen: false };
  }
  return result;
}

/** Convert "HH:mm" to minutes-since-midnight for ordering comparisons. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}

export type OpeningHoursErrors = Partial<Record<DayKey, string>>;

/**
 * Client-side validation mirroring the backend rules: open days need a valid
 * open + close, and close must be after open. Returns per-day error messages
 * (empty object = valid).
 */
export function validateOpeningHours(hours: OpeningHours): OpeningHoursErrors {
  const errors: OpeningHoursErrors = {};
  for (const day of DAY_ORDER) {
    const value = hours[day];
    if (!value.isOpen) continue;
    if (!isValidTime(value.open) || !isValidTime(value.close)) {
      errors[day] = "Set both an opening and closing time.";
      continue;
    }
    if (toMinutes(value.close) <= toMinutes(value.open)) {
      errors[day] = "Closing time must be after opening time.";
    }
  }
  return errors;
}

export function hasOpeningHoursErrors(errors: OpeningHoursErrors): boolean {
  return Object.keys(errors).length > 0;
}
