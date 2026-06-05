import type { Transition, Variants } from "framer-motion";

/**
 * Single source of truth for Framer Motion timing, kept in lockstep with the
 * CSS custom properties in globals.css (--ease-premium / --reveal-duration /
 * --reveal-distance / --reveal-scale). The whole site shares one entrance
 * signature: opacity 0→1, translateY 28→0, scale 0.97→1, premium easing.
 *
 * Reduced motion is honoured globally by <MotionProvider> (MotionConfig
 * reducedMotion="user"), which strips transforms and keeps opacity only.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DURATION = 0.6;
export const HOVER_DURATION = 0.25;
export const STAGGER = 0.1;

export const REVEAL_DISTANCE = 28;
export const REVEAL_SCALE = 0.97;

export const transition: Transition = { duration: DURATION, ease: EASE };
export const hoverTransition: Transition = { duration: HOVER_DURATION, ease: EASE };

/** The canonical entrance — slide up + fade + slight scale. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: REVEAL_DISTANCE, scale: REVEAL_SCALE },
  show: { opacity: 1, y: 0, scale: 1, transition },
};

/** Parent container that staggers entrance children by ~0.1s. */
export const stagger = (staggerChildren = STAGGER): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren } },
});

/** Modal/lightbox backdrop fade. */
export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: HOVER_DURATION, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE } },
};

/** Modal/lightbox panel — fade + scale + small rise, shared enter/exit. */
export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.2, ease: EASE } },
};

/** Tab-panel crossfade — small slide + slight scale on both enter and exit. */
export const tabPanel: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.25, ease: EASE } },
};
