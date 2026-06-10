"use client";

import { Switch } from "@/components/ui";
import {
  DAY_LABELS,
  DAY_ORDER,
  type OpeningHoursErrors,
} from "@/lib/openingHours";
import type { DayKey, OpeningHours } from "@/types";
import { cn } from "@/utils";

const timeInputClass =
  "rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors disabled:opacity-50";

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (next: OpeningHours) => void;
  errors?: OpeningHoursErrors;
  disabled?: boolean;
}

/**
 * Controlled seven-day opening-hours editor. Each day has an open/closed
 * toggle and, when open, 24-hour time inputs. Reused on the settings page and
 * the onboarding flow. Validation lives in lib/openingHours.ts — pass the
 * resulting `errors` to surface per-day messages.
 */
export function OpeningHoursEditor({
  value,
  onChange,
  errors,
  disabled,
}: OpeningHoursEditorProps) {
  const updateDay = (
    day: DayKey,
    patch: Partial<OpeningHours[DayKey]>,
  ) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  const toggleDay = (day: DayKey, isOpen: boolean) => {
    if (isOpen) {
      const current = value[day];
      updateDay(day, {
        isOpen: true,
        open: current.open ?? "09:00",
        close: current.close ?? "17:00",
      });
    } else {
      onChange({ ...value, [day]: { isOpen: false } });
    }
  };

  return (
    <div className="divide-y divide-border-subtle">
      {DAY_ORDER.map((day) => {
        const entry = value[day];
        const error = errors?.[day];
        return (
          <div key={day} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-3 min-w-[9rem]">
                <Switch
                  checked={entry.isOpen}
                  onCheckedChange={(next) => toggleDay(day, next)}
                  disabled={disabled}
                  label={`${DAY_LABELS[day]} open`}
                />
                <span className="text-sm font-medium text-text-primary">
                  {DAY_LABELS[day]}
                </span>
              </div>

              {entry.isOpen ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={entry.open ?? ""}
                    disabled={disabled}
                    onChange={(e) => updateDay(day, { open: e.target.value })}
                    className={timeInputClass}
                    aria-label={`${DAY_LABELS[day]} opening time`}
                  />
                  <span className="text-sm text-text-tertiary">to</span>
                  <input
                    type="time"
                    value={entry.close ?? ""}
                    disabled={disabled}
                    onChange={(e) => updateDay(day, { close: e.target.value })}
                    className={timeInputClass}
                    aria-label={`${DAY_LABELS[day]} closing time`}
                  />
                </div>
              ) : (
                <span className="text-sm text-text-tertiary">Closed</span>
              )}
            </div>
            {error && (
              <p
                className={cn(
                  "mt-1.5 text-xs text-rose-600",
                  "pl-[calc(2.75rem+0.75rem)]",
                )}
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
