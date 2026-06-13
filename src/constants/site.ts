/** Brand and navigation constants shared across the shell. */

export const BRAND = {
  name: "BookBites",
  fullName: "BookBites by Cuebites",
  logoAlt: "BookBites by Cuebites",
} as const;

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#industries", label: "Solutions" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "Resources" },
] as const;

/** Right-aligned account actions in the nav. */
export const NAV_ACTIONS = {
  login: { href: "#contact", label: "Log in" },
  cta: { href: "#pricing", label: "Start free" },
} as const;

export const CONTACT = {
  email: "hello@bookbites.app",
  phone: "+1 (415) 555-0142",
  locations: "San Francisco · London · Lisbon",
} as const;

export const FOOTER = {
  tagline:
    "Your website, booking engine and CRM in one platform — built for service businesses juggling many services, staff and calendars.",
  copyright: "© 2026 BookBites by Cuebites. All rights reserved.",
  note: "Made with care for operators worldwide.",
} as const;

/** Sitemap-style footer link columns. */
export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#integrations", label: "Integrations" },
      { href: "#security", label: "Security" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "#industries", label: "Salons" },
      { href: "#industries", label: "Clinics" },
      { href: "#industries", label: "Fitness" },
      { href: "#industries", label: "Tutors" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#faq", label: "Resources" },
      { href: "#faq", label: "FAQ" },
      { href: "#contact", label: "Contact" },
      { href: "#", label: "Privacy & terms" },
    ],
  },
] as const;
