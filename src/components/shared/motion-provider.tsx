"use client";

import { MotionConfig } from "framer-motion";

/**
 * Site-wide Framer Motion config. `reducedMotion="user"` makes every descendant
 * motion component honour `prefers-reduced-motion` automatically — transforms
 * (slide/scale) are dropped and only opacity animates — mirroring the CSS
 * reduced-motion handling in globals.css.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
