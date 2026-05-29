"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  CalendarCheck,
  Users,
  TrendingUp,
  BarChart3,
  Crown,
  Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import {
  useAnalyticsSummary,
  useAnalyticsBreakdown,
  useAnalyticsTimeseries,
} from "@/features/business-owner";
import type { AnalyticsRange } from "@/types";
import { cn, currencyFormat, formatDate } from "@/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const timeRangeOptions: Array<{ label: string; value: AnalyticsRange }> = [
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Year", value: "year" },
];

function chartLabel(periodStart: string, range: AnalyticsRange): string {
  if (range === "year") return formatDate(periodStart, "MMM");
  if (range === "90d") return formatDate(periodStart, "MMM D");
  return formatDate(periodStart, "MMM D");
}

export default function AnalyticsPage() {
  return (
    <FeatureGate feature="view_analytics" fallback={<AccessDenied />}>
      <AnalyticsContent />
    </FeatureGate>
  );
}

function AnalyticsContent() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [timeRange, setTimeRange] = useState<AnalyticsRange>("30d");

  const { summary, isLoading: summaryLoading } = useAnalyticsSummary(
    businessId,
    timeRange,
  );

  const { breakdown: servicesBreakdown, isLoading: servicesLoading } =
    useAnalyticsBreakdown(businessId, {
      groupBy: "service",
      range: timeRange,
      limit: 5,
      sortBy: "bookings",
    });

  const { breakdown: providersBreakdown, isLoading: providersLoading } =
    useAnalyticsBreakdown(businessId, {
      groupBy: "provider",
      range: timeRange,
      limit: 5,
      sortBy: "bookings",
    });

  const from = summary?.from;
  const to = summary?.to;

  const { timeseries: revenueSeries, isLoading: revenueLoading } =
    useAnalyticsTimeseries(
      businessId,
      { range: timeRange, metric: "revenue", from, to },
      { enabled: !!from && !!to },
    );

  const { timeseries: bookingsSeries, isLoading: bookingsLoading } =
    useAnalyticsTimeseries(
      businessId,
      { range: timeRange, metric: "bookings", from, to },
      { enabled: !!from && !!to },
    );

  const isLoading =
    summaryLoading ||
    servicesLoading ||
    providersLoading ||
    revenueLoading ||
    bookingsLoading;

  const revenueChartData = useMemo(
    () =>
      (revenueSeries?.points ?? []).map((p) => ({
        label: chartLabel(p.periodStart, timeRange),
        value: p.value,
      })),
    [revenueSeries, timeRange],
  );

  const bookingsChartData = useMemo(
    () =>
      (bookingsSeries?.points ?? []).map((p) => ({
        label: chartLabel(p.periodStart, timeRange),
        value: p.value,
      })),
    [bookingsSeries, timeRange],
  );

  const stats = summary
    ? [
        {
          label: "Revenue",
          value: currencyFormat(summary.revenue),
          icon: DollarSign,
          gradient: "from-[#D4A574]/20 to-[#D4A574]/5",
          iconColor: "text-[#D4A574]",
        },
        {
          label: "Total Bookings",
          value: summary.totalBookings,
          icon: CalendarCheck,
          gradient: "from-[#8BA88E]/20 to-[#8BA88E]/5",
          iconColor: "text-[#8BA88E]",
        },
        {
          label: "Total Customers",
          value: summary.uniqueCustomers,
          icon: Users,
          gradient: "from-blue-100/80 to-blue-50/40",
          iconColor: "text-blue-500",
        },
        {
          label: "Avg Booking Value",
          value: currencyFormat(summary.avgBookingValue),
          icon: TrendingUp,
          gradient: "from-amber-100/80 to-amber-50/40",
          iconColor: "text-amber-500",
        },
      ]
    : [];

  const topServices = servicesBreakdown?.items ?? [];
  const topProviders = providersBreakdown?.items ?? [];

  return (
    <main className="flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Insights
          </p>
          <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
            Analytics
          </h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            Track performance and business insights
          </p>
        </div>
        <div className="inline-flex bg-surface border border-border-subtle rounded-lg p-0.5">
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimeRange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                timeRange === opt.value
                  ? "bg-text-primary text-white"
                  : "text-text-tertiary hover:text-text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading && !summary && (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-border-subtle border-t-primary-500" />
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -2 }}
                className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-5 transition-colors hover:border-border-default"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                    stat.gradient,
                  )}
                >
                  <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-text-primary tabular tracking-tight mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnalyticsChartCard
              title="Revenue overview"
              subtitle="Revenue over the selected period"
              data={revenueChartData}
              valueFormatter={(v) => currencyFormat(v)}
              color="#D4A574"
              index={4}
            />
            <AnalyticsChartCard
              title="Booking trends"
              subtitle="Booking volume over time"
              data={bookingsChartData}
              valueFormatter={(v) => String(Math.round(v))}
              color="#8BA88E"
              index={5}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BreakdownCard
              title="Top services"
              icon={<Briefcase className="h-4 w-4 text-[#D4A574]" />}
              iconGradient="from-[#D4A574]/20 to-[#D4A574]/5"
              barGradient="from-[#D4A574] to-[#D4A574]/60"
              items={topServices}
              emptyLabel="No service data yet"
              index={6}
            />
            <BreakdownCard
              title="Top providers"
              icon={<Crown className="h-4 w-4 text-[#8BA88E]" />}
              iconGradient="from-[#8BA88E]/20 to-[#8BA88E]/5"
              barGradient="from-[#8BA88E] to-[#8BA88E]/60"
              items={topProviders}
              emptyLabel="No provider data yet"
              index={7}
              showRevenue={false}
            />
          </div>
        </>
      )}
    </main>
  );
}

function AnalyticsChartCard({
  title,
  subtitle,
  data,
  valueFormatter,
  color,
  index,
}: {
  title: string;
  subtitle: string;
  data: Array<{ label: string; value: number }>;
  valueFormatter: (v: number) => string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-border-subtle bg-surface p-6 min-h-[280px]"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-indigo-50 border border-border-subtle">
          <BarChart3 className="h-4 w-4 text-primary-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-text-tertiary">{subtitle}</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15,15,14,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => [valueFormatter(Number(value ?? 0)), ""]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(15,15,14,0.08)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

function BreakdownCard({
  title,
  icon,
  iconGradient,
  barGradient,
  items,
  emptyLabel,
  index,
  showRevenue = true,
}: {
  title: string;
  icon: React.ReactNode;
  iconGradient: string;
  barGradient: string;
  items: Array<{ id: string; name: string; bookingsCount: number; revenue: number }>;
  emptyLabel: string;
  index: number;
  showRevenue?: boolean;
}) {
  const maxCount = items[0]?.bookingsCount ?? 1;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-border-subtle bg-surface p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br",
            iconGradient,
          )}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const pct = (item.bookingsCount / maxCount) * 100;
            return (
              <div key={item.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-text-primary truncate">{item.name}</span>
                  <span className="text-text-tertiary ml-2 shrink-0 tabular text-xs">
                    {item.bookingsCount}
                    {showRevenue ? ` · ${currencyFormat(item.revenue)}` : " bookings"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.1 + idx * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={cn("h-full rounded-full bg-gradient-to-r", barGradient)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
