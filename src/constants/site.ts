/** Brand and navigation constants shared across the shell. */

export const BRAND = {
  name: "BookBites",
  fullName: "BookBites by Cuebites",
  logoAlt: "BookBites by Cuebites",
} as const;

export const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
] as const;

export const CONTACT = {
  email: "hello@bookbites.app",
  phone: "+1 (415) 555-0142",
  locations: "San Francisco · London · Lisbon",
} as const;

export const FOOTER = {
  tagline:
    "The all-in-one platform booking-based businesses use to run beautifully and grow predictably.",
  copyright: "© 2026 BookBites by Cuebites. All rights reserved.",
  note: "Made with care for operators worldwide.",
} as const;
