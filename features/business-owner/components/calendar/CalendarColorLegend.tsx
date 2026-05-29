"use client";

import type { Service } from "@/types";
import type { ProviderTone } from "./helpers";
import { CalendarFilterChip } from "./CalendarFilterChip";

interface CalendarColorLegendProps {
  services: Service[];
  serviceToneMap: Map<string, ProviderTone>;
  /** When set, only show this service in the legend. */
  activeServiceId?: string;
}

export function CalendarColorLegend({
  services,
  serviceToneMap,
  activeServiceId,
}: CalendarColorLegendProps) {
  const items = [...services]
    .filter((s) => !activeServiceId || s.id === activeServiceId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (items.length === 0) return null;

  return (
    <div className="px-4 lg:px-6 py-2 border-b border-border-subtle bg-surface/80 shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
        Service colors
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => {
          const tone = serviceToneMap.get(s.id);
          const chipTone = tone ?? {
            soft: "rgba(15, 15, 14, 0.06)",
            text: "var(--color-text-secondary)",
            line: "var(--color-border-subtle)",
            solid: "var(--color-text-tertiary)",
          };
          return (
            <CalendarFilterChip
              key={s.id}
              label={s.name}
              tone={chipTone}
              className="flex-none max-w-[160px]"
            />
          );
        })}
      </div>
    </div>
  );
}
