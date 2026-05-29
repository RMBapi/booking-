"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter, Menu, Plus, X } from "lucide-react";
import { cn } from "@/utils";
import { CreateBookingModal } from "./CreateBookingModal";
import { EditBookingModal } from "./EditBookingModal";
import { CancelBookingDialog } from "./CancelBookingDialog";
import { useGetBookings, useServiceProviders, useBusinessServices } from "../hooks";
import type { Booking, BookingStatus, ServiceProvider } from "@/types";
import { CalendarSidebar } from "./calendar/CalendarSidebar";
import { CalendarBookingSheet } from "./calendar/CalendarBookingSheet";
import { CalendarColorLegend } from "./calendar/CalendarColorLegend";
import { bookingServiceId } from "./calendar/bookingLayout";
import { TimeGridColumn, TimeLabelsColumn } from "./calendar/CalendarGrids";
import {
  DEFAULT_HOUR_HEIGHT,
  GRID_TOP_PADDING,
  PROVIDER_PALETTE,
  START_HOUR,
  UNASSIGNED_PROVIDER,
  addDays,
  bookingsForDay,
  formatDateHeader,
  formatMonthYear,
  formatWeekRange,
  getProviderName,
  getWeekDays,
  isSameDay,
  startOfWeek,
  startOfDay,
  toDateInput,
  type CalendarViewMode,
  type ProviderTone,
} from "./calendar/helpers";

interface CalendarViewProps {
  businessId: string;
}

const DEFAULT_STATUS: Record<BookingStatus, boolean> = {
  Pending: true,
  Confirmed: true,
  Completed: true,
  Cancelled: false,
};

export function CalendarView({ businessId }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarViewMode>("week");
  const [providerSearch, setProviderSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceVisibility, setServiceVisibility] = useState<Record<string, boolean>>({});
  const [calendarServiceFilterId, setCalendarServiceFilterId] = useState("");
  const [statusVisibility, setStatusVisibility] =
    useState<Record<BookingStatus, boolean>>(DEFAULT_STATUS);
  const [providerVisibility, setProviderVisibility] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hourHeight] = useState(DEFAULT_HOUR_HEIGHT);
  const [createBooking, setCreateBooking] = useState<{
    date?: string;
    start?: string;
    providerId?: string;
    serviceId?: string;
    requireService?: boolean;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const mainScrollRef = useRef<HTMLElement>(null);

  const bookingQuery = useMemo(() => {
    if (view === "day") {
      const start = startOfDay(selectedDate);
      const end = addDays(start, 1);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (view === "week") {
      const start = startOfWeek(selectedDate);
      const end = addDays(start, 7);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [view, selectedDate]);

  const { bookings: rawBookings, isLoading: bookingsLoading, refetch: refetchBookings } = useGetBookings(businessId, {
    ...bookingQuery,
    limit: 100,
    sortBy: "bookingTime",
    sortOrder: "asc",
  });
  const { providers } = useServiceProviders(businessId, { limit: 100 });
  const { services } = useBusinessServices(businessId, { limit: 100 });

  useEffect(() => {
    setServiceVisibility((prev) => {
      const next = { ...prev };
      let changed = false;
      services.forEach((s) => {
        if (!(s.id in next)) {
          next[s.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [services]);

  useEffect(() => {
    setProviderVisibility((prev) => {
      const next = { ...prev };
      let changed = false;
      providers.forEach((p) => {
        if (!(p.id in next)) {
          next[p.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [providers]);

  const bookings = useMemo(
    () => rawBookings.filter((b) => statusVisibility[b.status]),
    [rawBookings, statusVisibility],
  );

  const providerToneMap = useMemo(() => {
    const map = new Map<string, ProviderTone>();
    providers.forEach((p, i) => {
      map.set(p.id, PROVIDER_PALETTE[i % PROVIDER_PALETTE.length]);
    });
    return map;
  }, [providers]);

  const serviceToneMap = useMemo(() => {
    const map = new Map<string, ProviderTone>();
    services.forEach((s, i) => {
      map.set(s.id, PROVIDER_PALETTE[i % PROVIDER_PALETTE.length]);
    });
    return map;
  }, [services]);

  const defaultTone = PROVIDER_PALETTE[0];

  const getBookingTone = useCallback(
    (booking: Booking) => {
      const sid = bookingServiceId(booking);
      if (sid && serviceToneMap.has(sid)) return serviceToneMap.get(sid)!;
      if (booking.serviceProviderId && providerToneMap.has(booking.serviceProviderId)) {
        return providerToneMap.get(booking.serviceProviderId)!;
      }
      return defaultTone;
    },
    [serviceToneMap, providerToneMap, defaultTone],
  );

  const visibleProviders = useMemo(() => {
    return providers.filter((p) => providerVisibility[p.id] !== false);
  }, [providers, providerVisibility]);

  const visibleServices = useMemo(() => {
    return services.filter((s) => serviceVisibility[s.id] !== false);
  }, [services, serviceVisibility]);

  const isToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    if (view !== "day" && view !== "week") return;
    const el = mainScrollRef.current;
    if (!el) return;
    const now = new Date();
    const hour = isToday ? now.getHours() : 8;
    const scrollTop = Math.max(0, (hour - START_HOUR) * hourHeight - hourHeight);
    el.scrollTop = scrollTop;
  }, [view, selectedDate, hourHeight, isToday]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setSelectedDate((d) => {
        const next = new Date(d);
        if (view === "day") next.setDate(next.getDate() + direction);
        else if (view === "week") next.setDate(next.getDate() + direction * 7);
        else next.setMonth(next.getMonth() + direction);
        return next;
      });
    },
    [view],
  );

  const headerLabel = useMemo(() => {
    if (view === "day") return formatDateHeader(selectedDate);
    if (view === "week") return formatWeekRange(selectedDate);
    return formatMonthYear(selectedDate);
  }, [view, selectedDate]);

  const openCreateBooking = useCallback(
    (opts?: {
      date?: Date;
      start?: Date;
      providerId?: string;
      serviceId?: string;
      requireService?: boolean;
    }) => {
      const d = opts?.date ?? selectedDate;
      const serviceId =
        opts?.serviceId ??
        (calendarServiceFilterId || undefined);
      setCreateBooking({
        date: toDateInput(d),
        start: opts?.start?.toISOString(),
        providerId: opts?.providerId,
        serviceId,
        requireService: opts?.requireService ?? false,
      });
    },
    [selectedDate, calendarServiceFilterId],
  );

  const handleSlotClick = useCallback(
    (day: Date, halfHour: number, providerId?: string) => {
      const d = new Date(day);
      const hour = Math.floor(halfHour);
      const minute = halfHour % 1 ? 30 : 0;
      d.setHours(hour, minute, 0, 0);
      openCreateBooking({
        date: day,
        start: d,
        providerId,
        serviceId: calendarServiceFilterId || undefined,
        requireService: true,
      });
    },
    [openCreateBooking, calendarServiceFilterId],
  );

  const toggleStatus = (status: BookingStatus) => {
    setStatusVisibility((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const toggleProvider = (id: string) => {
    setProviderVisibility((prev) => ({ ...prev, [id]: prev[id] === false }));
  };

  const selectAllProviders = (visible: boolean) => {
    const next: Record<string, boolean> = {};
    providers.forEach((p) => {
      next[p.id] = visible;
    });
    setProviderVisibility(next);
  };

  const toggleService = (id: string) => {
    setServiceVisibility((prev) => ({ ...prev, [id]: prev[id] === false }));
  };

  const selectAllServices = (visible: boolean) => {
    const next: Record<string, boolean> = {};
    services.forEach((s) => {
      next[s.id] = visible;
    });
    setServiceVisibility(next);
  };

  const bookingMatchesServiceFilter = useCallback(
    (booking: Booking) => {
      const sid = bookingServiceId(booking);
      if (calendarServiceFilterId) {
        return sid === calendarServiceFilterId;
      }
      if (!services.length) return true;
      if (visibleServices.length === 0) return false;
      return visibleServices.some((s) => s.id === sid);
    },
    [services.length, visibleServices, calendarServiceFilterId],
  );

  const bookingMatchesProviderFilter = useCallback(
    (booking: Booking) => {
      if (!providers.length) return true;
      const pid = booking.serviceProviderId;
      if (!pid) return providerVisibility[UNASSIGNED_PROVIDER] !== false;
      if (visibleProviders.length === 0) return false;
      return visibleProviders.some((p) => p.id === pid);
    },
    [providers.length, visibleProviders, providerVisibility],
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (b) => bookingMatchesProviderFilter(b) && bookingMatchesServiceFilter(b),
      ),
    [bookings, bookingMatchesProviderFilter, bookingMatchesServiceFilter],
  );

  const sidebarProps = {
    businessId,
    selectedDate,
    onSelectDate: setSelectedDate,
    bookings: filteredBookings,
    services,
    providers,
    serviceSearch,
    onServiceSearchChange: setServiceSearch,
    serviceVisibility,
    onToggleService: toggleService,
    onSelectAllServices: selectAllServices,
    calendarServiceFilterId,
    onCalendarServiceFilterChange: setCalendarServiceFilterId,
    providerSearch,
    onProviderSearchChange: setProviderSearch,
    statusVisibility,
    onToggleStatus: toggleStatus,
    providerVisibility,
    onToggleProvider: toggleProvider,
    onSelectAllProviders: selectAllProviders,
    providerToneMap,
    serviceToneMap,
    onCreateBooking: () => openCreateBooking(),
  };

  return (
    <div className="-mx-4 lg:-mx-8 -my-6 lg:-my-10 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <header className="sticky top-14 z-20 bg-canvas/90 backdrop-blur-xl border-b border-border-subtle">
        <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(new Date());
                if (view === "month") setView("week");
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0",
                isSameDay(selectedDate, new Date())
                  ? "bg-text-primary text-white"
                  : "bg-surface text-text-secondary border border-border-subtle hover:border-border-default",
              )}
            >
              Today
            </button>
            <div className="flex items-center bg-surface border border-border-subtle rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-2 py-1.5 hover:bg-subtle transition-colors text-text-secondary"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-px h-5 bg-border-subtle" />
              <button
                type="button"
                onClick={() => navigate(1)}
                className="px-2 py-1.5 hover:bg-subtle transition-colors text-text-secondary"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-sm md:text-base font-semibold text-text-primary truncate">
              {headerLabel}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openCreateBooking()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-text-primary text-white text-sm font-medium hover:bg-text-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create booking</span>
            </button>
            <ViewSwitcher value={view} onChange={setView} />
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-border-subtle text-text-secondary hover:bg-subtle"
              aria-label="Toggle sidebar"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {sidebarOpen && (
          <div className="hidden lg:block h-full shrink-0 overflow-hidden">
            <CalendarSidebar {...sidebarProps} />
          </div>
        )}

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[280px] bg-surface shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle shrink-0">
                <span className="text-sm font-semibold">Calendar</span>
                <button type="button" onClick={() => setMobileSidebarOpen(false)}>
                  <X className="h-4 w-4 text-text-tertiary" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <CalendarSidebar {...sidebarProps} />
              </div>
            </div>
          </div>
        )}

        <main ref={mainScrollRef} className="flex-1 min-w-0 min-h-0 overflow-auto bg-canvas">
          {bookingsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600" />
            </div>
          ) : (
            <>
              <CalendarColorLegend
                services={
                  calendarServiceFilterId
                    ? services.filter((s) => s.id === calendarServiceFilterId)
                    : visibleServices.length > 0
                      ? visibleServices
                      : services
                }
                serviceToneMap={serviceToneMap}
                activeServiceId={calendarServiceFilterId || undefined}
              />
              {view === "day" ? (
                <DayView
                  selectedDate={selectedDate}
                  bookings={filteredBookings}
                  providers={visibleProviders}
                  defaultTone={defaultTone}
                  hourHeight={hourHeight}
                  getBookingTone={getBookingTone}
                  onSlotClick={(h, pid) => handleSlotClick(selectedDate, h, pid)}
                  onBookingClick={setSelectedBooking}
                  showNow={isToday}
                />
              ) : view === "week" ? (
                <WeekView
                  weekDays={weekDays}
                  bookings={filteredBookings}
                  defaultTone={defaultTone}
                  hourHeight={hourHeight}
                  getBookingTone={getBookingTone}
                  onSlotClick={handleSlotClick}
                  onBookingClick={setSelectedBooking}
                  onDayHeaderClick={setSelectedDate}
                />
              ) : (
                <MonthView
                  anchor={selectedDate}
                  bookings={filteredBookings}
                  serviceToneMap={serviceToneMap}
                  defaultTone={defaultTone}
                  onSelectDay={(d) => {
                    setSelectedDate(d);
                    setView("day");
                  }}
                  onCreateOnDay={(d) =>
                    openCreateBooking({
                      date: d,
                      serviceId: calendarServiceFilterId || undefined,
                      requireService: true,
                    })
                  }
                  onBookingClick={setSelectedBooking}
                />
              )}
            </>
          )}
        </main>
      </div>

      <CreateBookingModal
        businessId={businessId}
        open={!!createBooking}
        onClose={() => setCreateBooking(null)}
        initialDate={createBooking?.date}
        initialStart={createBooking?.start}
        initialProviderId={createBooking?.providerId}
        initialServiceId={createBooking?.serviceId}
        requireService={createBooking?.requireService}
      />

      <CalendarBookingSheet
        businessId={businessId}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onEdit={setEditBooking}
        onCancel={setCancelBooking}
        onUpdated={() => refetchBookings()}
      />

      <EditBookingModal
        businessId={businessId}
        booking={editBooking}
        onClose={() => setEditBooking(null)}
      />

      <CancelBookingDialog
        businessId={businessId}
        booking={cancelBooking}
        onClose={() => setCancelBooking(null)}
        onCancelled={() => refetchBookings()}
      />
    </div>
  );
}

function ViewSwitcher({
  value,
  onChange,
}: {
  value: CalendarViewMode;
  onChange: (v: CalendarViewMode) => void;
}) {
  const items: Array<{ k: CalendarViewMode; label: string }> = [
    { k: "day", label: "Day" },
    { k: "week", label: "Week" },
    { k: "month", label: "Month" },
  ];
  return (
    <LayoutGroup id="cal-view">
      <div className="inline-flex bg-surface border border-border-subtle rounded-lg p-0.5">
        {items.map((item) => {
          const active = value === item.k;
          return (
            <button
              key={item.k}
              type="button"
              onClick={() => onChange(item.k)}
              className={cn(
                "relative px-3 py-1 text-xs font-medium rounded-md transition-colors",
                active ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {active && (
                <motion.span
                  layoutId="cal-view-active"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-subtle"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function DayView({
  selectedDate,
  bookings,
  providers,
  defaultTone,
  hourHeight,
  getBookingTone,
  onSlotClick,
  onBookingClick,
  showNow,
}: {
  selectedDate: Date;
  bookings: Booking[];
  providers: ServiceProvider[];
  defaultTone: ProviderTone;
  hourHeight: number;
  getBookingTone: (booking: Booking) => ProviderTone;
  onSlotClick: (halfHour: number, providerId?: string) => void;
  onBookingClick: (booking: Booking) => void;
  showNow: boolean;
}) {
  const dayBookings = bookingsForDay(bookings, selectedDate);

  const columns: Array<{ id: string; label: string; bookings: Booking[] }> =
    providers.length > 0
      ? providers.map((p) => ({
          id: p.id,
          label: getProviderName(p),
          bookings: dayBookings.filter((b) => b.serviceProviderId === p.id),
        }))
      : [
          {
            id: "all",
            label: "All bookings",
            bookings: dayBookings,
          },
        ];

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-10 bg-canvas/90 backdrop-blur border-b border-border-subtle">
        <div className="flex">
          <div className="w-14 shrink-0" style={{ paddingTop: GRID_TOP_PADDING }} />
          {columns.map((col) => (
            <div key={col.id} className="flex-1 min-w-[140px] px-2 py-2 border-l border-border-subtle">
              <p className="text-xs font-semibold text-text-primary truncate">{col.label}</p>
              <p className="text-[10px] text-text-tertiary">{col.bookings.length} booking(s)</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex">
        <TimeLabelsColumn hourHeight={hourHeight} />
        {columns.map((col) => (
          <TimeGridColumn
            key={col.id}
            bookings={col.bookings}
            tone={defaultTone}
            getToneForBooking={getBookingTone}
            hourHeight={hourHeight}
            onSlotClick={(h) => onSlotClick(h, col.id === "all" ? undefined : col.id)}
            onBookingClick={onBookingClick}
            showNow={showNow}
          />
        ))}
      </div>
    </div>
  );
}

function WeekView({
  weekDays,
  bookings,
  defaultTone,
  hourHeight,
  getBookingTone,
  onSlotClick,
  onBookingClick,
  onDayHeaderClick,
}: {
  weekDays: Date[];
  bookings: Booking[];
  defaultTone: ProviderTone;
  hourHeight: number;
  getBookingTone: (booking: Booking) => ProviderTone;
  onSlotClick: (day: Date, halfHour: number) => void;
  onBookingClick: (booking: Booking) => void;
  onDayHeaderClick: (d: Date) => void;
}) {
  const today = new Date();

  return (
    <div className="min-w-[700px]">
      <div className="sticky top-0 z-10 bg-canvas/90 backdrop-blur border-b border-border-subtle">
        <div className="flex">
          <div className="w-14 shrink-0" style={{ paddingTop: GRID_TOP_PADDING }} />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onDayHeaderClick(day)}
                className={cn(
                  "flex-1 min-w-[100px] py-2 border-l border-border-subtle text-center hover:bg-subtle/60 transition-colors",
                  isToday && "bg-primary-50/50",
                )}
              >
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "text-lg font-semibold tabular",
                    isToday ? "text-primary-700" : "text-text-primary",
                  )}
                >
                  {day.getDate()}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative flex">
        <TimeLabelsColumn hourHeight={hourHeight} />
        {weekDays.map((day) => {
          const dayBookings = bookingsForDay(bookings, day);
          const isToday = isSameDay(day, today);
          return (
            <TimeGridColumn
              key={day.toISOString()}
              bookings={dayBookings}
              tone={defaultTone}
              getToneForBooking={getBookingTone}
              hourHeight={hourHeight}
              onSlotClick={(h) => onSlotClick(day, h)}
              onBookingClick={onBookingClick}
              showNow={isToday}
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  anchor,
  bookings,
  serviceToneMap,
  defaultTone,
  onSelectDay,
  onCreateOnDay,
  onBookingClick,
}: {
  anchor: Date;
  bookings: Booking[];
  serviceToneMap: Map<string, ProviderTone>;
  defaultTone: ProviderTone;
  onSelectDay: (d: Date) => void;
  onCreateOnDay: (d: Date) => void;
  onBookingClick: (booking: Booking) => void;
}) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const cells: Date[] = [];
  let cursor = new Date(gridStart);
  while (cells.length < 42) {
    cells.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  const today = new Date();

  return (
    <div className="p-3 md:p-4">
      <div className="grid grid-cols-7 gap-px bg-border-subtle rounded-xl overflow-hidden border border-border-subtle">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="bg-surface py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-text-tertiary"
          >
            {d}
          </div>
        ))}
        {cells.map((day) => {
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = isSameDay(day, today);
          const dayBookings = bookingsForDay(bookings, day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onCreateOnDay(day)}
              className={cn(
                "bg-surface min-h-[100px] p-1.5 text-left hover:bg-subtle/50 transition-colors flex flex-col",
                !inMonth && "bg-canvas/80 opacity-60",
                isToday && "ring-1 ring-inset ring-primary-300",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular mb-1",
                  isToday ? "bg-primary-600 text-white" : "text-text-secondary",
                )}
              >
                {day.getDate()}
              </span>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayBookings.slice(0, 3).map((b) => {
                  const sid = bookingServiceId(b);
                  const tone = (sid ? serviceToneMap.get(sid) : undefined) ?? defaultTone;
                  const cust = b.user || b.customer;
                  const name = cust
                    ? `${cust.firstName} ${cust.lastName ?? ""}`.trim()
                    : "Booking";
                  return (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick(b);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          onBookingClick(b);
                        }
                      }}
                      className="text-[10px] px-1 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80"
                      style={{ background: tone.soft, color: tone.text }}
                    >
                      {name}
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-text-tertiary px-1">
                    +{dayBookings.length - 3} more
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-text-tertiary mt-3 px-1">
        Click a day for day view. Click a booking to manage it. Double-click a day to create.
      </p>
    </div>
  );
}
