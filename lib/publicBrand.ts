/**
 * Brand palette for public business pages.
 *
 * Values mirror the CSS custom properties defined in globals.css under
 * `@theme { --color-brand-* }` so Tailwind utilities like `bg-brand-dark`
 * work out-of-the-box. This object is kept for inline-style use cases
 * (e.g. dynamic gradients where Tailwind classes aren't practical).
 */
export const BRAND = {
  dark: "#2C0800",
  darker: "#1A0500",
  card: "#3D0C02",
  accent: "#c9966d",
  cta: "#c9966d",
  ctaHover: "#b6865f",
} as const;

export type BrandTheme = typeof BRAND;
