import type { Business } from "@/types";

/**
 * Brand palette for public business pages.
 *
 * Values mirror the CSS custom properties defined in globals.css under
 * `@theme { --color-brand-* }` so Tailwind utilities like `bg-brand-dark`
 * work out-of-the-box. This object is kept for inline-style use cases
 * (e.g. dynamic gradients where Tailwind classes aren't practical).
 */
export const ELEGANZA = {
  ink: "#222222",
  inkSoft: "#2a2924",
  inkMuted: "#767676",
  background: "#fafafa",
  surface: "#ffffff",
  surfaceMuted: "#efefef",
  border: "#ddd3cf",
  accent: "#817b64",
  cta: "#817b64",
  ctaHover: "#6f6a55",
  dark: "#222222",
  darker: "#000000",
  card: "#ffffff",
} as const;

export const BRAND = {
  dark: "#2C0800",
  darker: "#1A0500",
  card: "#3D0C02",
  accent: "#c9966d",
  cta: "#c9966d",
  ctaHover: "#b6865f",
} as const;

export type BrandTheme = typeof BRAND;

/**
 * Resolve an image URL from the API. The backend now returns full absolute
 * URLs (e.g. Supabase public storage), so we pass them through unchanged.
 * Legacy "/uploads/..." DB records are considered broken and will render
 * as-is; they need to be re-uploaded.
 */
export function getImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return value;
}

/** Fallback when a business has no image or logo configured. */
export const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1723101917533-4fc9149c3684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=2000";

/** Resolve the still image shown before a hero MP4 plays. No logo/fallback chain. */
export function resolveHeroVideoPoster(
  business: Pick<Business, "backupImage"> | null | undefined,
): string | null {
  return getImageUrl(business?.backupImage);
}

/** Resolve the hero/background image for a business (same order as the public site). */
export function resolveBusinessHeroImage(
  business: Pick<Business, "image" | "logoUrl" | "logo"> | null | undefined,
): string {
  if (!business) return HERO_FALLBACK;
  return (
    getImageUrl(business.image) ||
    getImageUrl(business.logoUrl) ||
    getImageUrl(business.logo) ||
    HERO_FALLBACK
  );
}
