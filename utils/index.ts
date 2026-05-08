import { twMerge } from "tailwind-merge";
import { clsx, ClassValue } from "clsx";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date | dayjs.Dayjs,
  format = "MMM D, YYYY",
): string {
  return dayjs(date).format(format);
}

export function formatTime(
  date: string | Date | dayjs.Dayjs,
  format = "hh:mm:ss A",
): string {
  return dayjs(date).format(format);
}

export function currencyFormat(value: string | number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function getPublicSiteUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
    "http://localhost:3001/business/slug/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}${slug}`;
}

/**
 * Inline label fallback for feature codes when the
 * GET /business/:id/team/available-features endpoint isn't available
 * (e.g. error toasts mentioning a missing feature). Team UI MUST use the
 * API endpoint instead.
 */
export function humanizeFeatureCode(code: string): string {
  return code.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
