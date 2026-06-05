import type { StaticImageData } from "next/image";
import type { LucideIcon } from "lucide-react";

/** One of the four hero product screenshots shown around the center logo. */
export type HeroShot = {
  src: StaticImageData;
  /** Which side of the ecosystem this belongs to. */
  category: "customer" | "business";
  /** Badge text, e.g. "CUSTOMER EXPERIENCE". */
  categoryLabel: string;
  /** Short human title used for alt text and the lightbox header. */
  title: string;
  /** Hover/lightbox call-to-action, e.g. "View Full Experience". */
  actionHint: string;
  /** Grid corner on desktop: top/bottom × left/right. */
  corner: "tl" | "tr" | "bl" | "br";
};

export type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
};

export type ShowcaseTab = {
  key: string;
  label: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  bullets: string[];
  image: StaticImageData;
};

export type CalendarFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
};

export type FaqItem = {
  q: string;
  a: string;
};
