"use client";

import { type ElementType } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered entrance. Every reveal across the site shares ONE signature —
 * slide up + fade + slight scale via the `revealUp` keyframe (see globals.css),
 * which mirrors the Framer `fadeUp` variant in src/lib/motion.ts. Trigger-once;
 * pass `delay` to stagger a section's children (~0.1s apart). prefers-reduced-
 * motion is honoured in globals.css (the keyframe degrades to a fade).
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>();

  return (
    <Tag
      ref={ref}
      className={cn("animate-on-scroll", isVisible && "visible", className)}
      style={isVisible ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}
