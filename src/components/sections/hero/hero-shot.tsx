"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DURATION, EASE, HOVER_DURATION, fadeUp } from "@/lib/motion";
import type { HeroShot } from "@/types";

// Premium glassmorphism card. Brand-tinted rest shadow + a stronger hover glow,
// all sourced from the brand tokens.
const REST_SHADOW =
  "0 20px 55px -20px color-mix(in srgb, var(--color-brand-blue) 24%, transparent)";
const HOVER_SHADOW =
  "0 34px 90px rgba(0,0,0,0.16), 0 0 0 1px color-mix(in srgb, var(--color-brand-purple) 18%, transparent), 0 18px 60px -12px color-mix(in srgb, var(--color-brand-indigo) 45%, transparent)";

/**
 * One desktop/tablet hero screenshot card. Lifts and reveals a category badge
 * plus an action hint on hover; opens the lightbox on click. Forwards a ref so
 * the parent can anchor a connection line to it.
 */
export function HeroShotCard({
  shot,
  priority,
  delay,
  onOpen,
  onHoverChange,
  cardRef,
}: {
  shot: HeroShot;
  priority: boolean;
  delay: number;
  onOpen: () => void;
  /** Fires when the pointer (or keyboard focus) enters/leaves the card, so the
   * parent can highlight this card's connection line. */
  onHoverChange?: (active: boolean) => void;
  cardRef: (el: HTMLButtonElement | null) => void;
}) {
  const customer = shot.category === "customer";
  const accent = customer
    ? "var(--color-brand-blue)"
    : "var(--color-brand-purple)";
  // Anchor the hover scale to the card's INNER corner — the one nearest the
  // centre logo — so the card always grows up/down AND outward, away from the
  // ring, and its inner edges never move toward the circle. Mirrored per corner
  // keeps the four symmetric. (e.g. top-left card → pinned bottom-right.)
  const innerX = shot.corner === "tl" || shot.corner === "bl" ? "right" : "left";
  const innerY = shot.corner === "tl" || shot.corner === "tr" ? "bottom" : "top";

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      aria-label={`${shot.categoryLabel} — ${shot.title}. ${shot.actionHint}`}
      className="group relative block w-full max-w-[450px] md:max-w-[490px] lg:max-w-[550px] aspect-[16/10] rounded-2xl overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/60"
      style={{
        border: "1px solid rgba(255,255,255,0.4)",
        transformOrigin: `${innerX} ${innerY}`,
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      whileHover="hover"
      whileFocus="hover"
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      variants={{
        hidden: { ...fadeUp.hidden, boxShadow: REST_SHADOW },
        show: {
          ...fadeUp.show,
          boxShadow: REST_SHADOW,
          transition: { duration: DURATION, ease: EASE, delay },
        },
        hover: {
          scale: 1.06,
          boxShadow: HOVER_SHADOW,
          transition: { duration: HOVER_DURATION, ease: EASE },
        },
      }}
    >
      <Image
        src={shot.src}
        alt={shot.title}
        fill
        priority={priority}
        quality={90}
        sizes="(min-width: 1024px) 550px, (min-width: 768px) 450px, 90vw"
        placeholder="blur"
        className="object-cover"
      />

      {/* Soft accent glow ring, brightening on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms]"
        style={{
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 20%, transparent), inset 0 0 60px color-mix(in srgb, ${accent} 12%, transparent)`,
        }}
      />

      {/* Category badge — top-left, fades in on hover */}
      <motion.span
        className="absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur border text-[10px] font-semibold tracking-[0.1em] shadow-sm"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`,
          color: accent,
        }}
        variants={{
          hidden: { opacity: 0, y: -6 },
          show: { opacity: 0, y: -6 },
          hover: { opacity: 1, y: 0 },
        }}
        transition={{ duration: HOVER_DURATION, ease: EASE }}
      >
        ● {shot.categoryLabel}
      </motion.span>

      {/* Action hint — bottom, fades up on hover */}
      <motion.span
        className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur border border-white/60 text-[12px] font-medium shadow-md"
        variants={{
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 0, y: 8 },
          hover: { opacity: 1, y: 0 },
        }}
        transition={{ duration: HOVER_DURATION, ease: EASE }}
      >
        <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
          {shot.actionHint}
        </span>
        <ArrowRight className="h-3 w-3" style={{ color: accent }} />
      </motion.span>
    </motion.button>
  );
}
