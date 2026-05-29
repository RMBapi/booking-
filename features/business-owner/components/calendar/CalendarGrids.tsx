"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import type { Booking } from "@/types";
import {
  END_HOUR,
  GRID_TOP_PADDING,
  START_HOUR,
  type ProviderTone,
  bookingStatusVariant,
  formatHour,
  formatTimeShort,
} from "./helpers";
import { layoutBookings, getBookingBlockGeometry, type BookingLayoutItem } from "./bookingLayout";

interface BookingBlockProps {
  booking: Booking;
  tone: ProviderTone;
  hourHeight: number;
  gridHeight: number;
  compact?: boolean;
  layout?: Pick<BookingLayoutItem, "column" | "totalColumns">;
  onClick?: () => void;
}

export function BookingBlock({
  booking,
  tone,
  hourHeight,
  gridHeight,
  compact,
  layout,
  onClick,
}: BookingBlockProps) {
  const geo = getBookingBlockGeometry(
    booking.bookingTime.start,
    booking.bookingTime.end,
    hourHeight,
    gridHeight,
  );

  if (!geo.visible) return null;

  const { topOffset, height } = geo;
  const cust = booking.user || booking.customer;
  const customerName = cust ? `${cust.firstName} ${cust.lastName ?? ""}`.trim() : "Customer";
  const variant = bookingStatusVariant(booking.status);

  const column = layout?.column ?? 0;
  const totalColumns = layout?.totalColumns ?? 1;
  const widthPct = 100 / totalColumns;
  const leftPct = column * widthPct;

  const variantStyle: React.CSSProperties =
    variant === "confirmed"
      ? {
          background: tone.soft,
          color: tone.text,
          borderColor: tone.line,
          borderLeftColor: tone.solid,
        }
      : variant === "completed"
        ? {
            background: "rgba(16, 185, 129, 0.10)",
            color: "rgb(4, 120, 87)",
            borderColor: "rgba(16, 185, 129, 0.25)",
            borderLeftColor: "rgb(16, 185, 129)",
          }
        : variant === "muted"
          ? {
              background: "transparent",
              color: "var(--color-text-tertiary)",
              borderColor: "var(--color-border-subtle)",
              borderLeftColor: tone.line,
              opacity: 0.55,
            }
          : {
              background: tone.soft,
              color: tone.text,
              borderColor: tone.line,
              borderLeftColor: tone.solid,
            };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "absolute rounded-md border border-l-[3px] px-1 py-0.5 overflow-hidden text-left z-10 pointer-events-auto",
        variant === "tentative" && "stripe-soft",
        variant === "muted" && "border-dashed opacity-60",
      )}
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        ...variantStyle,
      }}
    >
      <p className="text-[11px] font-semibold truncate leading-snug">{customerName}</p>
      {height >= 36 && (
        <p className="text-[10px] tabular truncate opacity-75 leading-snug">
          {formatTimeShort(booking.bookingTime.start)}–{formatTimeShort(booking.bookingTime.end)}
        </p>
      )}
    </motion.button>
  );
}

export function CurrentTimeLine({ hourHeight }: { hourHeight: number }) {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = ((minutes - START_HOUR * 60) / 60) * hourHeight;

  if (minutes < START_HOUR * 60 || minutes >= END_HOUR * 60) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <span className="relative ml-[-4px] h-2 w-2 rounded-full bg-rose-500 shrink-0" />
        <div className="flex-1 h-px bg-rose-500/70" />
      </div>
    </div>
  );
}

interface TimeGridColumnProps {
  bookings: Booking[];
  tone: ProviderTone;
  hourHeight: number;
  getToneForBooking?: (booking: Booking) => ProviderTone;
  onSlotClick?: (halfHour: number) => void;
  onBookingClick?: (booking: Booking) => void;
  showNow?: boolean;
}

export function TimeGridColumn({
  bookings,
  tone,
  hourHeight,
  getToneForBooking,
  onSlotClick,
  onBookingClick,
  showNow,
}: TimeGridColumnProps) {
  const [hoverHalfHour, setHoverHalfHour] = useState<number | null>(null);
  const laidOut = useMemo(() => layoutBookings(bookings), [bookings]);
  const halfHours = Array.from(
    { length: (END_HOUR - START_HOUR) * 2 },
    (_, i) => START_HOUR + i / 2,
  );
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const gridHeight = hours.length * hourHeight;

  return (
    <div
      className="relative flex-1 min-w-[120px] border-l border-border-subtle overflow-hidden"
      style={{ paddingTop: GRID_TOP_PADDING, minHeight: gridHeight + GRID_TOP_PADDING }}
      onMouseLeave={() => setHoverHalfHour(null)}
    >
      <div className="relative" style={{ height: gridHeight }}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="border-b border-border-subtle box-border"
            style={{ height: `${hourHeight}px` }}
          />
        ))}

        {onSlotClick && (
          <div className="absolute inset-0 z-0">
            {halfHours.map((h) => (
              <button
                type="button"
                key={h}
                className="absolute left-0 right-0 cursor-pointer"
                style={{
                  top: `${(h - START_HOUR) * hourHeight}px`,
                  height: `${hourHeight / 2}px`,
                }}
                onMouseEnter={() => setHoverHalfHour(h)}
                onClick={() => onSlotClick(h)}
                aria-label={`Create booking at ${Math.floor(h)}:${h % 1 ? "30" : "00"}`}
              />
            ))}
          </div>
        )}

        {hoverHalfHour !== null && onSlotClick && (
          <div
            className="absolute left-0.5 right-0.5 z-[1] rounded-md border border-dashed pointer-events-none flex items-center justify-center text-[10px] font-medium"
            style={{
              top: `${(hoverHalfHour - START_HOUR) * hourHeight + 1}px`,
              height: `${hourHeight / 2 - 2}px`,
              borderColor: tone.line,
              background: tone.soft,
              color: tone.text,
            }}
          >
            + {formatHour(Math.floor(hoverHalfHour))}
            {hoverHalfHour % 1 ? ":30" : ""}
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
          <AnimatePresence>
            {laidOut.map(({ booking, column, totalColumns }) => (
              <BookingBlock
                key={booking.id}
                booking={booking}
                tone={getToneForBooking?.(booking) ?? tone}
                hourHeight={hourHeight}
                gridHeight={gridHeight}
                layout={{ column, totalColumns }}
                onClick={() => onBookingClick?.(booking)}
              />
            ))}
          </AnimatePresence>
        </div>

        {showNow && <CurrentTimeLine hourHeight={hourHeight} />}
      </div>
    </div>
  );
}

export function TimeLabelsColumn({ hourHeight }: { hourHeight: number }) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const gridHeight = hours.length * hourHeight;
  return (
    <div
      className="w-14 shrink-0 sticky left-0 z-10 bg-canvas"
      style={{ paddingTop: GRID_TOP_PADDING, minHeight: gridHeight + GRID_TOP_PADDING }}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          className="relative border-b border-border-subtle box-border"
          style={{ height: `${hourHeight}px` }}
        >
          <span className="absolute top-1 right-1 text-[10px] font-medium text-text-tertiary tabular leading-none">
            {formatHour(hour)}
          </span>
        </div>
      ))}
    </div>
  );
}
