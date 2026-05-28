import type { Variants } from "framer-motion";

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

export const OPERATING_HOURS = [
  { day: "Monday", hours: "7:00 AM – 6:00 PM" },
  { day: "Tuesday", hours: "7:00 AM – 6:00 PM" },
  { day: "Wednesday", hours: "7:00 AM – 6:00 PM" },
  { day: "Thursday", hours: "7:00 AM – 7:00 PM" },
  { day: "Friday", hours: "7:00 AM – 6:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];
