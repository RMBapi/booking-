import type { Booking } from "@/types";
import { END_HOUR, START_HOUR } from "./helpers";

export interface BookingLayoutItem {
  booking: Booking;
  column: number;
  totalColumns: number;
}

export interface BookingBlockGeometry {
  topOffset: number;
  height: number;
  visible: boolean;
}

function overlaps(a: Booking, b: Booking): boolean {
  const a0 = new Date(a.bookingTime.start).getTime();
  const a1 = new Date(a.bookingTime.end).getTime();
  const b0 = new Date(b.bookingTime.start).getTime();
  const b1 = new Date(b.bookingTime.end).getTime();
  return a0 < b1 && b0 < a1;
}

function buildCluster(seed: Booking, sorted: Booking[], processed: Set<string>): Booking[] {
  const cluster: Booking[] = [];
  const queue = [seed];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (processed.has(current.id)) continue;
    processed.add(current.id);
    cluster.push(current);
    for (const other of sorted) {
      if (!processed.has(other.id) && overlaps(other, current)) {
        queue.push(other);
      }
    }
  }
  return cluster;
}

/** Pixel position + height for a booking block, clamped to the visible day grid. */
export function getBookingBlockGeometry(
  startIso: string,
  endIso: string,
  hourHeight: number,
  gridHeight: number,
): BookingBlockGeometry {
  const start = new Date(startIso);
  const end = new Date(endIso);

  let startMinutes = start.getHours() * 60 + start.getMinutes();
  let endMinutes = end.getHours() * 60 + end.getMinutes();

  if (end.getDate() !== start.getDate() || endMinutes <= startMinutes) {
    endMinutes = Math.min(startMinutes + 30, END_HOUR * 60);
  }

  const gridStart = START_HOUR * 60;
  const gridEnd = END_HOUR * 60;

  if (startMinutes >= gridEnd || endMinutes <= gridStart) {
    return { topOffset: 0, height: 0, visible: false };
  }

  startMinutes = Math.max(startMinutes, gridStart);
  endMinutes = Math.min(endMinutes, gridEnd);

  const durationMinutes = Math.max(endMinutes - startMinutes, 5);
  const topOffset = ((startMinutes - gridStart) / 60) * hourHeight;
  const rawHeight = (durationMinutes / 60) * hourHeight - 1;
  const maxHeight = gridHeight - topOffset - 1;
  const height = Math.min(Math.max(rawHeight, 16), maxHeight);

  return {
    topOffset,
    height: Math.max(height, 0),
    visible: height >= 12,
  };
}

/** Side-by-side layout for concurrent bookings in the same column. */
export function layoutBookings(bookings: Booking[]): BookingLayoutItem[] {
  if (bookings.length === 0) return [];

  const sorted = [...bookings].sort(
    (a, b) =>
      new Date(a.bookingTime.start).getTime() - new Date(b.bookingTime.start).getTime(),
  );

  const result: BookingLayoutItem[] = [];
  const processed = new Set<string>();

  for (const booking of sorted) {
    if (processed.has(booking.id)) continue;

    const cluster = buildCluster(booking, sorted, processed).sort(
      (a, b) =>
        new Date(a.bookingTime.start).getTime() - new Date(b.bookingTime.start).getTime(),
    );

    const columnById = new Map<string, number>();

    for (const b of cluster) {
      const start = new Date(b.bookingTime.start).getTime();
      const usedCols = new Set<number>();
      for (const other of cluster) {
        if (other.id === b.id || !columnById.has(other.id)) continue;
        const otherEnd = new Date(other.bookingTime.end).getTime();
        if (overlaps(other, b) && otherEnd > start) {
          usedCols.add(columnById.get(other.id)!);
        }
      }
      let col = 0;
      while (usedCols.has(col)) col++;
      columnById.set(b.id, col);
    }

    const totalColumns =
      cluster.length === 0
        ? 1
        : Math.max(...cluster.map((b) => columnById.get(b.id) ?? 0)) + 1;

    for (const b of cluster) {
      result.push({
        booking: b,
        column: columnById.get(b.id) ?? 0,
        totalColumns,
      });
    }
  }

  return result;
}

export function bookingServiceId(booking: Booking): string | undefined {
  return booking.serviceId || booking.service?.id;
}

/** Count active (non-cancelled) bookings overlapping a time window. */
export function countBookingsInWindow(
  bookings: Booking[],
  startMs: number,
  endMs: number,
  opts?: { serviceId?: string; serviceProviderId?: string },
): number {
  return bookings.filter((b) => {
    if (b.status === "Cancelled") return false;
    const sid = bookingServiceId(b);
    if (opts?.serviceId && sid !== opts.serviceId) return false;
    if (opts?.serviceProviderId && b.serviceProviderId !== opts.serviceProviderId) return false;
    const b0 = new Date(b.bookingTime.start).getTime();
    const b1 = new Date(b.bookingTime.end).getTime();
    return b0 < endMs && b1 > startMs;
  }).length;
}
