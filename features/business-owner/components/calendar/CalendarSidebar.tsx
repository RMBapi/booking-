"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/utils";
import type { Booking, BookingStatus, Service, ServiceProvider } from "@/types";
import {
  STATUS_LABELS,
  type ProviderTone,
  getProviderName,
  isSameDay,
} from "./helpers";
import {
  CalendarFilterChip,
  STATUS_CHIP_TONES,
} from "./CalendarFilterChip";

interface CalendarSidebarProps {
  businessId: string;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  bookings: Booking[];
  services: Service[];
  providers: ServiceProvider[];
  serviceSearch: string;
  onServiceSearchChange: (v: string) => void;
  serviceVisibility: Record<string, boolean>;
  onToggleService: (id: string) => void;
  onSelectAllServices: (visible: boolean) => void;
  calendarServiceFilterId: string;
  onCalendarServiceFilterChange: (id: string) => void;
  providerSearch: string;
  onProviderSearchChange: (v: string) => void;
  statusVisibility: Record<BookingStatus, boolean>;
  onToggleStatus: (status: BookingStatus) => void;
  providerVisibility: Record<string, boolean>;
  onToggleProvider: (id: string) => void;
  onSelectAllProviders: (visible: boolean) => void;
  providerToneMap: Map<string, ProviderTone>;
  serviceToneMap: Map<string, ProviderTone>;
}

export function CalendarSidebar({
  businessId,
  selectedDate,
  onSelectDate,
  bookings,
  services,
  providers,
  serviceSearch,
  onServiceSearchChange,
  serviceVisibility,
  onToggleService,
  onSelectAllServices,
  calendarServiceFilterId,
  onCalendarServiceFilterChange,
  providerSearch,
  onProviderSearchChange,
  statusVisibility,
  onToggleStatus,
  providerVisibility,
  onToggleProvider,
  onSelectAllProviders,
  providerToneMap,
  serviceToneMap,
}: CalendarSidebarProps) {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  const bookingDaysInMonth = useMemo(() => {
    const set = new Set<number>();
    bookings.forEach((b) => {
      const d = new Date(b.bookingTime.start);
      if (d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [bookings, viewMonth]);

  const monthCells = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const cells: Array<Date | null> = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return cells;
  }, [viewMonth]);

  const filteredProviders = useMemo(() => {
    if (!providerSearch.trim()) return providers;
    const q = providerSearch.toLowerCase();
    return providers.filter((p) => getProviderName(p).toLowerCase().includes(q));
  }, [providers, providerSearch]);

  const filteredServices = useMemo(() => {
    const sorted = [...services].sort((a, b) => a.name.localeCompare(b.name));
    if (!serviceSearch.trim()) return sorted;
    const q = serviceSearch.toLowerCase();
    return sorted.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  const allProvidersVisible =
    providers.length > 0 && providers.every((p) => providerVisibility[p.id] !== false);

  const allServicesVisible =
    services.length > 0 && services.every((s) => serviceVisibility[s.id] !== false);

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <aside className="w-[260px] shrink-0 border-r border-border-subtle bg-surface/50 h-full overflow-y-auto custom-scrollbar">
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() =>
              setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-subtle text-text-secondary"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text-primary">{monthLabel}</span>
          <button
            type="button"
            onClick={() =>
              setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-subtle text-text-secondary"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-[10px] text-text-tertiary uppercase tracking-wider mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="text-center font-medium py-0.5">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {monthCells.map((d, i) => {
            if (!d) return <span key={i} />;
            const selected = isSameDay(d, selectedDate);
            const today = isSameDay(d, new Date());
            const hasBookings = bookingDaysInMonth.has(d.getDate());
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDate(d)}
                className={cn(
                  "relative h-8 text-xs tabular rounded-md transition-colors flex flex-col items-center justify-center",
                  selected
                    ? "bg-text-primary text-white font-semibold"
                    : today
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-text-secondary hover:bg-subtle",
                )}
              >
                {d.getDate()}
                {hasBookings && !selected && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-b border-border-subtle">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
          Booking status
        </p>
        <ul className="space-y-1.5">
          {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((status) => {
            const active = statusVisibility[status];
            return (
              <li key={status}>
                <label className="flex items-center gap-2 py-0.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggleStatus(status)}
                    className="h-3.5 w-3.5 shrink-0 rounded border-border-subtle text-primary-600 focus:ring-primary-200"
                  />
                  <CalendarFilterChip
                    label={STATUS_LABELS[status]}
                    tone={STATUS_CHIP_TONES[status]}
                    active={active}
                    striped={status === "Pending"}
                    dashed={status === "Cancelled"}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Services
          </p>
          {services.length > 0 && !calendarServiceFilterId && (
            <button
              type="button"
              onClick={() => onSelectAllServices(!allServicesVisible)}
              className="text-[11px] font-medium text-primary-700 hover:text-primary-800"
            >
              {allServicesVisible ? "Clear all" : "Select all"}
            </button>
          )}
        </div>
        {services.length > 0 ? (
          <>
            <label className="block mb-2">
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                Filter calendar by service
              </span>
              <select
                value={calendarServiceFilterId}
                onChange={(e) => onCalendarServiceFilterChange(e.target.value)}
                className="mt-1 w-full text-sm rounded-lg border border-border-subtle bg-canvas px-2 py-1.5 text-text-primary focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              >
                <option value="">All services (use checkboxes)</option>
                {[...services]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} only
                    </option>
                  ))}
              </select>
            </label>
            {!calendarServiceFilterId && (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => onServiceSearchChange(e.target.value)}
                    placeholder="Search services"
                    className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg bg-canvas border border-border-subtle focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <ul className="space-y-1 -mx-1 px-1">
                  {filteredServices.map((s) => {
                    const checked = serviceVisibility[s.id] !== false;
                    const tone = serviceToneMap.get(s.id);
                    const chipTone = tone ?? {
                      soft: "rgba(15, 15, 14, 0.06)",
                      text: "var(--color-text-secondary)",
                      line: "var(--color-border-subtle)",
                      solid: "var(--color-text-tertiary)",
                    };
                    return (
                      <li key={s.id}>
                        <label className="flex items-center gap-2 py-0.5 px-1 rounded-lg cursor-pointer hover:bg-subtle/80">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleService(s.id)}
                            className="h-3.5 w-3.5 shrink-0 rounded border-border-subtle text-primary-600 focus:ring-primary-200"
                          />
                          <CalendarFilterChip
                            label={s.name}
                            tone={chipTone}
                            active={checked}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {calendarServiceFilterId && (
              <p className="text-xs text-text-tertiary mt-1">
                Showing only{" "}
                <span className="font-medium text-text-secondary">
                  {services.find((s) => s.id === calendarServiceFilterId)?.name ?? "selected service"}
                </span>
                . Clear the filter to use checkboxes again.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-text-tertiary">No services yet.</p>
        )}
      </div>

      <div className="p-3 pb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Providers
          </p>
          {providers.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectAllProviders(!allProvidersVisible)}
              className="text-[11px] font-medium text-primary-700 hover:text-primary-800"
            >
              {allProvidersVisible ? "Clear all" : "Select all"}
            </button>
          )}
        </div>
        {providers.length > 0 ? (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
              <input
                type="text"
                value={providerSearch}
                onChange={(e) => onProviderSearchChange(e.target.value)}
                placeholder="Search providers"
                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg bg-canvas border border-border-subtle focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <ul className="space-y-1 -mx-1 px-1">
              {filteredProviders.map((p) => {
                const name = getProviderName(p);
                const tone = providerToneMap.get(p.id);
                const checked = providerVisibility[p.id] !== false;
                const chipTone = tone ?? {
                  soft: "rgba(15, 15, 14, 0.06)",
                  text: "var(--color-text-secondary)",
                  line: "var(--color-border-subtle)",
                  solid: "var(--color-text-tertiary)",
                };
                return (
                  <li key={p.id}>
                    <label className="flex items-center gap-2 py-0.5 px-1 rounded-lg cursor-pointer hover:bg-subtle/80">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleProvider(p.id)}
                        className="h-3.5 w-3.5 shrink-0 rounded border-border-subtle text-primary-600 focus:ring-primary-200"
                      />
                      <CalendarFilterChip label={name} tone={chipTone} active={checked} />
                    </label>
                  </li>
                );
              })}
              {filteredProviders.length === 0 && (
                <li className="text-xs text-text-tertiary py-2 text-center">No matches</li>
              )}
            </ul>
          </>
        ) : (
          <div className="text-xs text-text-tertiary leading-relaxed">
            <p>No providers yet. Bookings still appear on the calendar.</p>
            <Link
              href={`/app/${businessId}/providers`}
              className="inline-block mt-2 text-primary-700 font-medium hover:underline"
            >
              Add providers →
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
