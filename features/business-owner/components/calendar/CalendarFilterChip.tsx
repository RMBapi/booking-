"use client";

import { cn } from "@/utils";
import type { BookingStatus } from "@/types";
import type { ProviderTone } from "./helpers";

export type FilterChipTone = {
  soft: string;
  text: string;
  line: string;
  solid: string;
};

export const STATUS_CHIP_TONES: Record<BookingStatus, FilterChipTone> = {
  Pending: {
    soft: "rgba(251, 191, 36, 0.12)",
    text: "rgb(146, 84, 11)",
    line: "rgba(251, 191, 36, 0.28)",
    solid: "rgb(251, 191, 36)",
  },
  Confirmed: {
    soft: "rgba(59, 130, 246, 0.12)",
    text: "rgb(29, 78, 216)",
    line: "rgba(59, 130, 246, 0.28)",
    solid: "rgb(59, 130, 246)",
  },
  Completed: {
    soft: "rgba(16, 185, 129, 0.10)",
    text: "rgb(4, 120, 87)",
    line: "rgba(16, 185, 129, 0.25)",
    solid: "rgb(16, 185, 129)",
  },
  Cancelled: {
    soft: "rgba(168, 162, 158, 0.08)",
    text: "rgb(87, 83, 78)",
    line: "rgba(168, 162, 158, 0.35)",
    solid: "rgb(168, 162, 158)",
  },
};

interface CalendarFilterChipProps {
  label: string;
  tone: FilterChipTone;
  active?: boolean;
  /** Pending-style diagonal stripes (matches tentative bookings on the grid). */
  striped?: boolean;
  /** Dashed border (matches cancelled / muted bookings). */
  dashed?: boolean;
  className?: string;
}

export function CalendarFilterChip({
  label,
  tone,
  active = true,
  striped = false,
  dashed = false,
  className,
}: CalendarFilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center min-w-0 flex-1 rounded-md border border-l-[3px] px-2 py-1 text-[11px] font-semibold truncate leading-snug transition-opacity",
        striped && active && "stripe-soft",
        (dashed || !active) && "border-dashed",
        !active && "opacity-40",
        className,
      )}
      style={{
        background: active ? tone.soft : "transparent",
        color: active ? tone.text : "var(--color-text-tertiary)",
        borderColor: tone.line,
        borderLeftColor: tone.solid,
      }}
    >
      {label}
    </span>
  );
}
