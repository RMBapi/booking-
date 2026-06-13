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

/** A third-party review badge in the social-proof strip. */
export type ReviewBadge = {
  /** Platform name, e.g. "Trustpilot". */
  name: string;
  /** Rating out of 5, e.g. 4.8. */
  rating: number;
};

/** One column of the before/after/result value-prop comparison. */
export type ValueCard = {
  /** Stage label: "Before" | "After" | "Result". */
  kind: string;
  icon: LucideIcon;
  title: string;
  points: string[];
  /** Highlight the middle ("After") card as the payoff. */
  highlight?: boolean;
};

/** One step of the numbered Create → Set up → Get booked → Manage journey. */
export type JourneyStep = {
  /** Two-digit step number, e.g. "01". */
  num: string;
  /** Short uppercase kicker, e.g. "CREATE". */
  kicker: string;
  title: string;
  desc: string;
  /** Optional feature chips shown under the copy. */
  chips?: string[];
  /** Optional inline text link label. */
  cta?: string;
  image: StaticImageData;
  /** Image side on desktop. Alternates down the list. */
  imageSide: "left" | "right";
};

/** A headline metric in the quantified-outcomes band. */
export type Outcome = {
  value: string;
  label: string;
  icon: LucideIcon;
};

/** An industry tile in the self-identification grid. */
export type Industry = {
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
};

/** A logo tile in the integrations strip. */
export type Integration = {
  name: string;
  icon: LucideIcon;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  /** Initials shown in the avatar circle. */
  initials: string;
};

export type PricingTier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  /** Marks the recommended ("most popular") tier. */
  popular?: boolean;
};
