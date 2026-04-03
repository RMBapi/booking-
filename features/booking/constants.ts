import { BRAND } from "@/lib/publicBrand";

export const B = {
  dark: BRAND.dark,
  darker: BRAND.darker,
  card: BRAND.card,
  cardHov: BRAND.card,
  border: "rgba(255,255,255,0.10)",
  muted: "rgba(255,255,255,0.45)",
  accent: BRAND.accent,
  cta: BRAND.cta,
  ctaHov: BRAND.ctaHover,
  white: "#FFFFFF",
} as const;

export const TIME_SLOTS = [
  "7:00 AM",  "7:30 AM",  "8:00 AM",  "8:30 AM",
  "9:00 AM",  "9:30 AM",  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM",  "12:30 PM",
  "1:00 PM",  "1:30 PM",  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "3:30 PM",  "4:00 PM",  "4:30 PM",
  "5:00 PM",  "5:30 PM",
];

export const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DEFAULT_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1606333259737-6da197890fa2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

export const STEP_TRANSITION = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.3, ease: "easeInOut" as const },
};
