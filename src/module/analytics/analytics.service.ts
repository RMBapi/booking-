import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsTimeseriesQueryDto } from './dto/analytics-timeseries-query.dto';
import { AnalyticsBreakdownQueryDto } from './dto/analytics-breakdown-query.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';

const REVENUE_STATUSES = [BookingStatus.Confirmed, BookingStatus.Completed];

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(
    businessId: string,
    timezone?: string,
    includeCancelled = false,
  ) {
    const tz = this.normalizeTimeZone(timezone);
    const now = new Date();
    const todayStart = this.startOfDay(now, tz);
    const todayEnd = this.endOfDay(now, tz);
    const cancelFilter = includeCancelled
      ? Prisma.sql``
      : Prisma.sql`AND "status" <> ${BookingStatus.Cancelled}`;

    const todayRows = await this.prisma.$queryRaw<
      { status: string; count: number }[]
    >(Prisma.sql`
      SELECT "status", COUNT(*)::int AS "count"
      FROM "bookings"
      WHERE "business_id" = ${businessId}
        AND "bookingTime" IS NOT NULL
        AND ("bookingTime"->>'start')::timestamptz >= ${todayStart}
        AND ("bookingTime"->>'start')::timestamptz <= ${todayEnd}
        ${cancelFilter}
      GROUP BY "status"
    `);

    const todayCounts = this.mapStatusCounts(todayRows);
    const todayBookingsCount = Object.values(todayCounts).reduce(
      (sum, value) => sum + value,
      0,
    );

    const activeProvidersToday = await this.prisma.$queryRaw<
      { count: number }[]
    >(Prisma.sql`
      SELECT COUNT(DISTINCT "service_provider_id")::int AS "count"
      FROM "bookings"
      WHERE "business_id" = ${businessId}
        AND "service_provider_id" IS NOT NULL
        AND "bookingTime" IS NOT NULL
        AND ("bookingTime"->>'start')::timestamptz >= ${todayStart}
        AND ("bookingTime"->>'start')::timestamptz <= ${todayEnd}
        ${cancelFilter}
    `);

    const lastWeekStart = this.addDays(todayStart, -7);
    const lastWeekEnd = this.addDays(todayEnd, -7);
    const lastWeekCount = await this.countBookings(
      businessId,
      lastWeekStart,
      lastWeekEnd,
      includeCancelled,
    );

    const bookingsVsLastWeekPercent = this.calculatePercentChange(
      todayBookingsCount,
      lastWeekCount,
    );

    const [activeServices, teamMembers, activeProviders, newCustomersLast7] =
      await Promise.all([
        this.prisma.service.count({
          where: {
            deletedAt: null,
            isActive: true,
            businessServices: { some: { businessId } },
          },
        }),
        this.prisma.userBusiness.count({
          where: { businessId, status: 'Active' },
        }),
        this.prisma.serviceProvider.count({
          where: { businessId, deletedAt: null },
        }),
        this.countNewCustomersLast7Days(businessId, tz),
      ]);

    const sparklineStart = this.addDays(todayStart, -6);
    const sparklineMap = await this.getDailyBookingCounts(
      businessId,
      sparklineStart,
      todayEnd,
      tz,
      includeCancelled,
    );

    const sparkline = this.buildDateSeries(sparklineStart, 7, tz, (date) => ({
      date,
      bookings: sparklineMap.get(date) ?? 0,
    }));

    const weekStart = this.startOfWeek(now, tz);
    const weekEnd = this.endOfDay(this.addDays(weekStart, 6), tz);
    const weekMap = await this.getDailyBookingCounts(
      businessId,
      weekStart,
      weekEnd,
      tz,
      includeCancelled,
    );
    const todayIso = this.formatIsoDate(todayStart, tz);

    const weekHeatmap = this.buildDateSeries(weekStart, 7, tz, (date) => ({
      date,
      dayOfWeek: this.getWeekdayIndex(date, tz),
      bookings: weekMap.get(date) ?? 0,
      isToday: date === todayIso,
    }));

    return {
      today: {
        bookingsCount: todayBookingsCount,
        activeProvidersCount: Number(activeProvidersToday[0]?.count ?? 0),
        pendingCount: todayCounts.Pending || 0,
        confirmedCount: todayCounts.Confirmed || 0,
        completedCount: todayCounts.Completed || 0,
      },
      comparison: {
        bookingsVsLastWeekPercent,
        bookingsLastWeekSameDay: lastWeekCount,
      },
      counts: {
        activeServices,
        teamMembers,
        activeProviders,
        newCustomersLast7Days: newCustomersLast7,
      },
      sparkline,
      weekHeatmap,
    };
  }

  async getAnalyticsSummary(
    businessId: string,
    range: '30d' | '90d' | 'year',
    timezone?: string,
  ) {
    const tz = this.normalizeTimeZone(timezone);
    const { start, end } = this.resolveRange(range, tz);

    const summaryRows = await this.prisma.$queryRaw<
      {
        totalBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        pendingBookings: number;
        confirmedBookings: number;
        revenueBookings: number;
        revenue: string | number | null;
      }[]
    >(Prisma.sql`
      SELECT
        COUNT(*)::int AS "totalBookings",
        COUNT(*) FILTER (WHERE b.status = ${BookingStatus.Completed})::int AS "completedBookings",
        COUNT(*) FILTER (WHERE b.status = ${BookingStatus.Cancelled})::int AS "cancelledBookings",
        COUNT(*) FILTER (WHERE b.status = ${BookingStatus.Pending})::int AS "pendingBookings",
        COUNT(*) FILTER (WHERE b.status = ${BookingStatus.Confirmed})::int AS "confirmedBookings",
        COUNT(*) FILTER (WHERE b.status IN (${Prisma.join(REVENUE_STATUSES)}))::int AS "revenueBookings",
        COALESCE(SUM(CASE WHEN b.status IN (${Prisma.join(REVENUE_STATUSES)}) THEN s.price ELSE 0 END), 0) AS "revenue"
      FROM "bookings" b
      JOIN "services" s ON s.id = b.service_id
      WHERE b.business_id = ${businessId}
        AND b."bookingTime" IS NOT NULL
        AND (b."bookingTime"->>'start')::timestamptz >= ${start}
        AND (b."bookingTime"->>'start')::timestamptz <= ${end}
    `);

    const summary = summaryRows[0] ?? {
      totalBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      revenueBookings: 0,
      revenue: 0,
    };

    const revenue = Number(summary.revenue ?? 0);
    const revenueBookings = Number(summary.revenueBookings ?? 0);
    const avgBookingValue = revenueBookings > 0 ? revenue / revenueBookings : 0;

    const uniqueRows = await this.prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        SELECT COUNT(DISTINCT COALESCE(b.user_id::text, lower(b.guest_email)))::int AS "count"
        FROM "bookings" b
        WHERE b.business_id = ${businessId}
          AND b."bookingTime" IS NOT NULL
          AND (b."bookingTime"->>'start')::timestamptz >= ${start}
          AND (b."bookingTime"->>'start')::timestamptz <= ${end}
          AND COALESCE(b.user_id::text, lower(b.guest_email)) IS NOT NULL
      `,
    );

    return {
      range,
      from: start.toISOString(),
      to: end.toISOString(),
      revenue: Number.isNaN(revenue) ? 0 : revenue,
      currency: 'USD',
      totalBookings: Number(summary.totalBookings ?? 0),
      uniqueCustomers: Number(uniqueRows[0]?.count ?? 0),
      avgBookingValue,
      completedBookings: Number(summary.completedBookings ?? 0),
      cancelledBookings: Number(summary.cancelledBookings ?? 0),
      pendingBookings: Number(summary.pendingBookings ?? 0),
    };
  }

  async getAnalyticsTimeseries(
    businessId: string,
    query: AnalyticsTimeseriesQueryDto,
  ) {
    const tz = this.normalizeTimeZone(query.timezone);
    const from = this.parseDate(query.from, 'from');
    const to = this.parseDate(query.to, 'to');
    if (to < from) {
      throw new BadRequestException('to must be after from');
    }

    const periodExpr = this.buildPeriodExpr(query.granularity, tz);
    const intervalExpr = this.buildIntervalExpr(query.granularity);
    const valueExpr =
      query.metric === 'revenue'
        ? Prisma.sql`COALESCE(SUM(CASE WHEN status IN (${Prisma.join(
            REVENUE_STATUSES,
          )}) THEN price ELSE 0 END), 0)`
        : Prisma.sql`COUNT(*)`;

    const rows = await this.prisma.$queryRaw<
      { periodStart: string; periodEnd: string; value: string | number }[]
    >(Prisma.sql`
      SELECT
        to_char(period_start, 'YYYY-MM-DD') AS "periodStart",
        to_char(period_start + ${intervalExpr} - interval '1 day', 'YYYY-MM-DD') AS "periodEnd",
        ${valueExpr}::numeric AS "value"
      FROM (
        SELECT ${periodExpr} AS period_start, b.status, s.price
        FROM "bookings" b
        JOIN "services" s ON s.id = b.service_id
        WHERE b.business_id = ${businessId}
          AND b."bookingTime" IS NOT NULL
          AND (b."bookingTime"->>'start')::timestamptz >= ${from}
          AND (b."bookingTime"->>'start')::timestamptz <= ${to}
      ) t
      GROUP BY period_start
      ORDER BY period_start
    `);

    return {
      metric: query.metric,
      granularity: query.granularity,
      points: rows.map((row) => ({
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        value: Number(row.value ?? 0),
      })),
    };
  }

  async getAnalyticsBreakdown(
    businessId: string,
    query: AnalyticsBreakdownQueryDto,
  ) {
    const tz = this.normalizeTimeZone(undefined);
    const { start, end } = this.resolveRange(query.range, tz);
    const limit = query.limit ?? 5;
    const sortBy = query.sortBy ?? 'bookings';

    if (query.groupBy === 'service') {
      const rows = await this.prisma.$queryRaw<
        {
          id: string;
          name: string;
          bookingsCount: number;
          revenue: string | number | null;
        }[]
      >(Prisma.sql`
        SELECT
          s.id,
          s.name,
          COUNT(*)::int AS "bookingsCount",
          COALESCE(SUM(CASE WHEN b.status IN (${Prisma.join(
            REVENUE_STATUSES,
          )}) THEN s.price ELSE 0 END), 0) AS "revenue"
        FROM "bookings" b
        JOIN "services" s ON s.id = b.service_id
        WHERE b.business_id = ${businessId}
          AND b."bookingTime" IS NOT NULL
          AND (b."bookingTime"->>'start')::timestamptz >= ${start}
          AND (b."bookingTime"->>'start')::timestamptz <= ${end}
        GROUP BY s.id, s.name
        ORDER BY ${
          sortBy === 'revenue'
            ? Prisma.sql`"revenue"`
            : Prisma.sql`"bookingsCount"`
        } DESC
        LIMIT ${limit}
      `);

      return {
        groupBy: query.groupBy,
        items: rows.map((row) => ({
          id: row.id,
          name: row.name,
          bookingsCount: Number(row.bookingsCount ?? 0),
          revenue: Number(row.revenue ?? 0),
        })),
      };
    }

    const rows = await this.prisma.$queryRaw<
      {
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        bookingsCount: number;
        revenue: string | number | null;
      }[]
    >(Prisma.sql`
      SELECT
        sp.id,
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        COUNT(*)::int AS "bookingsCount",
        COALESCE(SUM(CASE WHEN b.status IN (${Prisma.join(
          REVENUE_STATUSES,
        )}) THEN s.price ELSE 0 END), 0) AS "revenue"
      FROM "bookings" b
      JOIN "services" s ON s.id = b.service_id
      LEFT JOIN "service_providers" sp ON sp.id = b.service_provider_id
      LEFT JOIN "users" u ON u.id = sp.user_id
      WHERE b.business_id = ${businessId}
        AND b."bookingTime" IS NOT NULL
        AND (b."bookingTime"->>'start')::timestamptz >= ${start}
        AND (b."bookingTime"->>'start')::timestamptz <= ${end}
      GROUP BY sp.id, u.first_name, u.last_name
      ORDER BY ${
        sortBy === 'revenue'
          ? Prisma.sql`"revenue"`
          : Prisma.sql`"bookingsCount"`
      } DESC
      LIMIT ${limit}
    `);

    return {
      groupBy: query.groupBy,
      items: rows.map((row) => ({
        id: row.id ?? 'unassigned',
        name: row.id
          ? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() ||
            'Unnamed Provider'
          : 'Unassigned',
        bookingsCount: Number(row.bookingsCount ?? 0),
        revenue: Number(row.revenue ?? 0),
      })),
    };
  }

  async getActivity(businessId: string, query: ActivityQueryDto) {
    const limit = Math.min(query.limit ?? 20, 100);
    const cursorDate = query.cursor
      ? this.parseDate(query.cursor, 'cursor')
      : null;
    const types = this.parseActivityTypes(query.types);

    const where: Prisma.BookingWhereInput = {
      businessId,
    };

    if (types) {
      const statusFilter = this.mapActivityTypesToStatuses(types);
      if (statusFilter.length > 0) {
        where.status = { in: statusFilter };
      }
    }

    if (cursorDate) {
      where.updatedAt = { lt: cursorDate };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        service: { select: { id: true, name: true } },
        serviceProvider: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const items = bookings
      .map((booking) => {
        const status = booking.status;
        const type = this.mapBookingToActivityType(status);
        if (types && !types.has(type)) return null;

        const actor = booking.user
          ? {
              id: booking.user.id,
              firstName: booking.user.firstName,
              lastName: booking.user.lastName,
            }
          : booking.guestFirstName ||
              booking.guestLastName ||
              booking.guestEmail
            ? {
                id: null,
                firstName: booking.guestFirstName ?? null,
                lastName: booking.guestLastName ?? null,
              }
            : null;

        const providerName = booking.serviceProvider?.user
          ? `${booking.serviceProvider.user.firstName ?? ''} ${
              booking.serviceProvider.user.lastName ?? ''
            }`.trim()
          : null;

        const summary = this.buildActivitySummary(type, booking, providerName);

        return {
          id: `act_${booking.id}`,
          type,
          occurredAt:
            status === BookingStatus.Pending
              ? booking.createdAt.toISOString()
              : booking.updatedAt.toISOString(),
          actor,
          summary,
          entity: {
            kind: 'booking',
            id: booking.id,
          },
          metadata: {
            serviceName: booking.service?.name ?? null,
            providerName,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const nextCursor =
      items.length > 0 ? items[items.length - 1].occurredAt : null;

    return {
      items,
      nextCursor,
    };
  }

  private parseActivityTypes(types?: string) {
    if (!types || types === 'all') return null;
    const set = new Set(
      types
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    return set.size > 0 ? set : null;
  }

  private mapActivityTypesToStatuses(types: Set<string>) {
    const statusSet = new Set<BookingStatus>();
    if (types.has('booking.created')) statusSet.add(BookingStatus.Pending);
    if (types.has('booking.confirmed')) statusSet.add(BookingStatus.Confirmed);
    if (types.has('booking.completed')) statusSet.add(BookingStatus.Completed);
    if (types.has('booking.cancelled')) statusSet.add(BookingStatus.Cancelled);
    return Array.from(statusSet);
  }

  private mapBookingToActivityType(status: BookingStatus) {
    switch (status) {
      case BookingStatus.Confirmed:
        return 'booking.confirmed';
      case BookingStatus.Completed:
        return 'booking.completed';
      case BookingStatus.Cancelled:
        return 'booking.cancelled';
      default:
        return 'booking.created';
    }
  }

  private buildActivitySummary(
    type: string,
    booking: {
      guestFirstName: string | null;
      guestLastName: string | null;
      guestEmail: string | null;
      service?: { name?: string | null } | null;
    },
    providerName: string | null,
  ) {
    const customerName =
      booking.guestFirstName || booking.guestLastName
        ? `${booking.guestFirstName ?? ''} ${booking.guestLastName ?? ''}`.trim()
        : (booking.guestEmail ?? 'A customer');
    const serviceName = booking.service?.name ?? 'a service';
    const providerSegment = providerName ? ` with ${providerName}` : '';

    switch (type) {
      case 'booking.confirmed':
        return `${customerName} confirmed ${serviceName}${providerSegment}`;
      case 'booking.completed':
        return `${customerName} completed ${serviceName}${providerSegment}`;
      case 'booking.cancelled':
        return `${customerName} cancelled ${serviceName}${providerSegment}`;
      default:
        return `${customerName} booked ${serviceName}${providerSegment}`;
    }
  }

  private calculatePercentChange(current: number, previous: number) {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private mapStatusCounts(rows: { status: string; count: number }[]) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number(row.count ?? 0);
      return acc;
    }, {});
  }

  private async countBookings(
    businessId: string,
    start: Date,
    end: Date,
    includeCancelled: boolean,
  ) {
    const cancelFilter = includeCancelled
      ? Prisma.sql``
      : Prisma.sql`AND "status" <> ${BookingStatus.Cancelled}`;
    const rows = await this.prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS "count"
        FROM "bookings"
        WHERE "business_id" = ${businessId}
          AND "bookingTime" IS NOT NULL
          AND ("bookingTime"->>'start')::timestamptz >= ${start}
          AND ("bookingTime"->>'start')::timestamptz <= ${end}
          ${cancelFilter}
      `,
    );
    return Number(rows[0]?.count ?? 0);
  }

  private async countNewCustomersLast7Days(businessId: string, tz: string) {
    const now = new Date();
    const end = this.endOfDay(now, tz);
    const start = this.startOfDay(this.addDays(now, -6), tz);
    const rows = await this.prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS "count"
        FROM (
          SELECT
            COALESCE(b.user_id::text, lower(b.guest_email)) AS identity,
            MIN((b."bookingTime"->>'start')::timestamptz) AS first_booking
          FROM "bookings" b
          WHERE b.business_id = ${businessId}
            AND b."bookingTime" IS NOT NULL
            AND b.status <> ${BookingStatus.Cancelled}
            AND COALESCE(b.user_id::text, lower(b.guest_email)) IS NOT NULL
          GROUP BY identity
        ) t
        WHERE t.first_booking >= ${start}
          AND t.first_booking <= ${end}
      `,
    );
    return Number(rows[0]?.count ?? 0);
  }

  private async getDailyBookingCounts(
    businessId: string,
    start: Date,
    end: Date,
    tz: string,
    includeCancelled: boolean,
  ) {
    const cancelFilter = includeCancelled
      ? Prisma.sql``
      : Prisma.sql`AND "status" <> ${BookingStatus.Cancelled}`;

    const rows = await this.prisma.$queryRaw<
      { date: string; count: number }[]
    >(Prisma.sql`
      SELECT
        to_char(("bookingTime"->>'start')::timestamptz AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS "date",
        COUNT(*)::int AS "count"
      FROM "bookings"
      WHERE "business_id" = ${businessId}
        AND "bookingTime" IS NOT NULL
        AND ("bookingTime"->>'start')::timestamptz >= ${start}
        AND ("bookingTime"->>'start')::timestamptz <= ${end}
        ${cancelFilter}
      GROUP BY "date"
      ORDER BY "date"
    `);

    return new Map(rows.map((row) => [row.date, Number(row.count ?? 0)]));
  }

  private buildDateSeries<T>(
    start: Date,
    days: number,
    tz: string,
    builder: (date: string) => T,
  ) {
    const items: T[] = [];
    for (let i = 0; i < days; i += 1) {
      const day = this.addDays(start, i);
      items.push(builder(this.formatIsoDate(day, tz)));
    }
    return items;
  }

  private resolveRange(range: '30d' | '90d' | 'year', tz: string) {
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const now = new Date();
    const end = this.endOfDay(now, tz);
    const start = this.startOfDay(this.addDays(now, -(days - 1)), tz);
    return { start, end };
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} must be a valid ISO date`);
    }
    return date;
  }

  private normalizeTimeZone(timeZone?: string) {
    if (!timeZone) return 'UTC';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone });
      return timeZone;
    } catch {
      return 'UTC';
    }
  }

  private getZonedParts(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '0';
    return {
      year: Number(get('year')),
      month: Number(get('month')),
      day: Number(get('day')),
      hour: Number(get('hour')),
      minute: Number(get('minute')),
      second: Number(get('second')),
    };
  }

  private getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
    const parts = this.getZonedParts(date, timeZone);
    const utc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    return (utc - date.getTime()) / 60000;
  }

  private startOfDay(date: Date, timeZone: string) {
    const parts = this.getZonedParts(date, timeZone);
    const utcStart = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      0,
      0,
      0,
      0,
    );
    const offset = this.getTimeZoneOffsetMinutes(new Date(utcStart), timeZone);
    return new Date(utcStart - offset * 60000);
  }

  private endOfDay(date: Date, timeZone: string) {
    const parts = this.getZonedParts(date, timeZone);
    const utcEnd = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      23,
      59,
      59,
      999,
    );
    const offset = this.getTimeZoneOffsetMinutes(new Date(utcEnd), timeZone);
    return new Date(utcEnd - offset * 60000);
  }

  private startOfWeek(date: Date, timeZone: string) {
    const dayIndex = this.getWeekdayIndex(
      this.formatIsoDate(date, timeZone),
      timeZone,
    );
    const diff = dayIndex - 1;
    return this.addDays(this.startOfDay(date, timeZone), -diff);
  }

  private getWeekdayIndex(dateIso: string, timeZone: string) {
    const date = new Date(`${dateIso}T12:00:00.000Z`);
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
    }).format(date);
    const map: Record<string, number> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 7,
    };
    return map[day] ?? 1;
  }

  private formatIsoDate(date: Date, timeZone: string) {
    const parts = this.getZonedParts(date, timeZone);
    return `${parts.year.toString().padStart(4, '0')}-${parts.month
      .toString()
      .padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`;
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 86_400_000);
  }

  private buildPeriodExpr(granularity: 'day' | 'week' | 'month', tz: string) {
    if (granularity === 'week') {
      return Prisma.sql`date_trunc('week', (b."bookingTime"->>'start')::timestamptz AT TIME ZONE ${tz})`;
    }
    if (granularity === 'month') {
      return Prisma.sql`date_trunc('month', (b."bookingTime"->>'start')::timestamptz AT TIME ZONE ${tz})`;
    }
    return Prisma.sql`date_trunc('day', (b."bookingTime"->>'start')::timestamptz AT TIME ZONE ${tz})`;
  }

  private buildIntervalExpr(granularity: 'day' | 'week' | 'month') {
    if (granularity === 'week') {
      return Prisma.sql`interval '1 week'`;
    }
    if (granularity === 'month') {
      return Prisma.sql`interval '1 month'`;
    }
    return Prisma.sql`interval '1 day'`;
  }
}
