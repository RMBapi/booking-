import React from "react";
import { cn } from "@/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "muted";

const TONE_STYLES: Record<StatusTone, { dot: string; chip: string }> = {
  success: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50/60 text-emerald-700 border-emerald-100",
  },
  warning: {
    dot: "bg-amber-500",
    chip: "bg-amber-50/60 text-amber-700 border-amber-100",
  },
  danger: {
    dot: "bg-rose-500",
    chip: "bg-rose-50/60 text-rose-700 border-rose-100",
  },
  info: {
    dot: "bg-primary-500",
    chip: "bg-primary-50/60 text-primary-700 border-primary-100",
  },
  neutral: {
    dot: "bg-text-tertiary",
    chip: "bg-subtle text-text-secondary border-border-subtle",
  },
  muted: {
    dot: "bg-text-quaternary",
    chip: "bg-subtle/60 text-text-tertiary border-border-subtle",
  },
};

export interface StatusPillProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
  withDot?: boolean;
}

export function StatusPill({
  tone = "neutral",
  children,
  className,
  withDot = true,
}: StatusPillProps) {
  const style = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        style.chip,
        className,
      )}
    >
      {withDot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
}
