"use client";

import { useMemo } from "react";
import type { AvailableFeature, FeatureCode } from "@/types";

const SECTION_BY_PREFIX: Array<{ title: string; match: (code: string) => boolean }> = [
  { title: "Dashboard", match: (c) => c === "view_dashboard" },
  { title: "Bookings", match: (c) => c.endsWith("bookings") },
  { title: "Services", match: (c) => c.endsWith("services") },
  { title: "Contacts", match: (c) => c.endsWith("contacts") },
  { title: "Providers", match: (c) => c.endsWith("providers") },
  { title: "Calendar", match: (c) => c === "view_calendar" },
  { title: "Settings", match: (c) => c === "view_settings" },
  { title: "Team", match: (c) => c === "manage_team" },
  { title: "Business", match: (c) => c === "manage_business" },
  { title: "Analytics", match: (c) => c === "view_analytics" },
];

interface Props {
  features: AvailableFeature[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({
  features,
  selected,
  onChange,
  disabled,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, AvailableFeature[]>();
    for (const f of features) {
      const section =
        SECTION_BY_PREFIX.find((s) => s.match(f.code))?.title ?? "Other";
      const arr = map.get(section) ?? [];
      arr.push(f);
      map.set(section, arr);
    }
    return Array.from(map.entries());
  }, [features]);

  const toggle = (code: string) => {
    if (disabled) return;
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code],
    );
  };

  const allCodes = features.map((f) => f.code as FeatureCode);
  const allSelected =
    allCodes.length > 0 && allCodes.every((c) => selected.includes(c));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {selected.length} of {allCodes.length} selected
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange(allSelected ? [] : (allCodes as string[]))
          }
          className="text-sm text-stone-700 hover:underline disabled:opacity-50"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      {grouped.map(([section, items]) => {
        const sectionCodes = items.map((i) => i.code);
        const sectionAllSelected = sectionCodes.every((c) =>
          selected.includes(c),
        );
        return (
          <div
            key={section}
            className="border border-stone-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-stone-900">
                {section}
              </h4>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (sectionAllSelected) {
                    onChange(
                      selected.filter((c) => !sectionCodes.includes(c as FeatureCode)),
                    );
                  } else {
                    const merged = new Set([...selected, ...sectionCodes]);
                    onChange(Array.from(merged));
                  }
                }}
                className="text-xs text-stone-600 hover:underline disabled:opacity-50"
              >
                {sectionAllSelected ? "Clear" : "Select all"}
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((f) => (
                <li key={f.code} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`feat-${f.code}`}
                    checked={selected.includes(f.code)}
                    disabled={disabled}
                    onChange={() => toggle(f.code)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`feat-${f.code}`}
                    className="text-sm text-stone-800"
                  >
                    <div className="font-medium">{f.label}</div>
                    <div className="text-stone-500 text-xs">
                      {f.description}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
