import type { AnalyticsGranularity, AnalyticsRange } from "@/types";

export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function granularityForRange(range: AnalyticsRange): AnalyticsGranularity {
  if (range === "30d") return "day";
  if (range === "90d") return "week";
  return "month";
}

export function formatPercentChange(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}%`;
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const absMin = Math.abs(diffMs / 60000);
  const absDay = absMin / 1440;
  const past = diffMs < 0;

  if (absMin < 1) return "Just now";
  if (absMin < 60) {
    return past ? `${Math.round(absMin)}m ago` : `in ${Math.round(absMin)}m`;
  }
  const absHr = absMin / 60;
  if (absHr < 24) {
    return past ? `${Math.round(absHr)}h ago` : `in ${Math.round(absHr)}h`;
  }
  if (absDay < 7) {
    return past ? `${Math.round(absDay)}d ago` : `in ${Math.round(absDay)}d`;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initialsFromName(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

/** Mon=1 … Sun=7 → single-letter labels for heatmap */
export function weekdayLabel(dayOfWeek: number): string {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  return labels[Math.max(0, Math.min(6, dayOfWeek - 1))] ?? "?";
}
