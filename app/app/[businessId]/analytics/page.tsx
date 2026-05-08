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
import { useGetBookings, useBusinessServices } from "@/features/business-owner";
import { cn, currencyFormat } from "@/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type TimeRange = "30d" | "90d" | "year";

const timeRangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "This Year", value: "year" },
];

export default function AnalyticsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const { bookings, isLoading: bookingsLoading } = useGetBookings(businessId);
  const { services, isLoading: servicesLoading } = useBusinessServices(
    businessId,
    {}
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const isLoading = bookingsLoading || servicesLoading;

  const analytics = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "30d") cutoff.setDate(now.getDate() - 30);
    else if (timeRange === "90d") cutoff.setDate(now.getDate() - 90);
    else cutoff.setMonth(0, 1);

    const rangeBookings = bookings.filter(
      (b) => new Date(b.bookingTime.start) >= cutoff
    );

    const revenue = rangeBookings.reduce(
      (sum, b) => sum + (b.service?.price ?? 0),
      0
    );
    const totalBookings = rangeBookings.length;
    const uniqueCustomers = new Set(rangeBookings.map((b) => b.userId))
      .size;
    const avgValue = totalBookings > 0 ? revenue / totalBookings : 0;

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    rangeBookings.forEach((b) => {
      const name = b.service?.name ?? "Unknown";
      const existing = serviceMap.get(b.serviceId) ?? {
        name,
        count: 0,
        revenue: 0,
      };
      existing.count++;
      existing.revenue += b.service?.price ?? 0;
      serviceMap.set(b.serviceId, existing);
    });
    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const providerMap = new Map<string, { name: string; count: number }>();
    rangeBookings.forEach((b) => {
      const name = b.serviceProvider
        ? `${b.serviceProvider.firstName ?? ""} ${b.serviceProvider.lastName ?? ""}`.trim()
        : "Unknown";
      const existing = providerMap.get(b.serviceProviderId) ?? {
        name,
        count: 0,
      };
      existing.count++;
      providerMap.set(b.serviceProviderId, existing);
    });
    const topProviders = Array.from(providerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { revenue, totalBookings, uniqueCustomers, avgValue, topServices, topProviders };
  }, [bookings, timeRange]);

  const stats = [
    {
      label: "Revenue",
      value: currencyFormat(analytics.revenue),
      icon: DollarSign,
      gradient: "from-[#D4A574]/20 to-[#D4A574]/5",
      iconColor: "text-[#D4A574]",
    },
    {
      label: "Total Bookings",
      value: analytics.totalBookings,
      icon: CalendarCheck,
      gradient: "from-[#8BA88E]/20 to-[#8BA88E]/5",
      iconColor: "text-[#8BA88E]",
    },
    {
      label: "Total Customers",
      value: analytics.uniqueCustomers,
      icon: Users,
      gradient: "from-blue-100/80 to-blue-50/40",
      iconColor: "text-blue-500",
    },
    {
      label: "Avg Booking Value",
      value: currencyFormat(analytics.avgValue),
      icon: TrendingUp,
      gradient: "from-amber-100/80 to-amber-50/40",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <main className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Insights</p>
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
              onClick={() => setTimeRange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                timeRange === opt.value
                  ? "bg-text-primary text-white"
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-border-subtle border-t-primary-500" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Stats Grid */}
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
                    stat.gradient
                  )}
                >
                  <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-text-primary tabular tracking-tight mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart Placeholders */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[
              { title: "Revenue Overview", sub: "Monthly revenue breakdown" },
              { title: "Booking Trends", sub: "Booking volume over time" },
            ].map((chart, i) => (
              <motion.div
                key={chart.title}
                custom={i + 4}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface p-10 min-h-[200px]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-border-subtle">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text-primary tracking-tight">
                  {chart.title}
                </h3>
                <p className="mt-1 text-xs text-text-tertiary">{chart.sub}</p>
                <p className="mt-3 text-xs text-text-quaternary">
                  Chart integration coming soon
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom Row: Top Services + Top Providers */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Top Services */}
            <motion.div
              custom={6}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-border-subtle bg-surface p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4A574]/20 to-[#D4A574]/5">
                  <Briefcase className="h-4 w-4 text-[#D4A574]" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                  Top Services
                </h3>
              </div>
              {analytics.topServices.length === 0 ? (
                <p className="text-sm text-text-tertiary py-4 text-center">
                  No service data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topServices.map((svc, idx) => {
                    const maxCount = analytics.topServices[0]?.count ?? 1;
                    const pct = (svc.count / maxCount) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-text-primary truncate">
                            {svc.name}
                          </span>
                          <span className="text-text-tertiary ml-2 shrink-0 tabular text-xs">
                            {svc.count} · {currencyFormat(svc.revenue)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-[#D4A574] to-[#D4A574]/60"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Top Providers */}
            <motion.div
              custom={7}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-2xl border border-border-subtle bg-surface p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8BA88E]/20 to-[#8BA88E]/5">
                  <Crown className="h-4 w-4 text-[#8BA88E]" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                  Top Providers
                </h3>
              </div>
              {analytics.topProviders.length === 0 ? (
                <p className="text-sm text-text-tertiary py-4 text-center">
                  No provider data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topProviders.map((prov, idx) => {
                    const maxCount = analytics.topProviders[0]?.count ?? 1;
                    const pct = (prov.count / maxCount) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-text-primary truncate">
                            {prov.name || "Unknown"}
                          </span>
                          <span className="text-text-tertiary ml-2 shrink-0 tabular text-xs">
                            {prov.count} bookings
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-subtle overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 + idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-[#8BA88E] to-[#8BA88E]/60"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </main>
  );
}
