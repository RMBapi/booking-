"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DollarSign,
  CalendarCheck,
  Users,
  Briefcase,
  Clock,
  ArrowRight,
  TrendingUp,
  UserPlus,
  BarChart3,
} from "lucide-react";
import {
  useGetBookings,
  useBusinessServices,
  useServiceProviders,
} from "@/features/business-owner";
import { cn } from "@/utils";
import { Booking } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusConfig: Record<
  Booking["status"],
  { label: string; bg: string; text: string; dot: string }
> = {
  Confirmed: {
    label: "Confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  Pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  Completed: {
    label: "Completed",
    bg: "bg-stone-100",
    text: "text-stone-600",
    dot: "bg-stone-400",
  },
  Cancelled: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

export default function BusinessDashboardPage() {
  const router = useRouter();
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const { bookings, isLoading: bookingsLoading } = useGetBookings(businessId);
  const { services, isLoading: servicesLoading } = useBusinessServices(
    businessId,
    {},
  );
  const { providers, isLoading: providersLoading } = useServiceProviders(
    businessId,
    {},
  );

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "Confirmed" || b.status === "Pending",
      ),
    [bookings],
  );

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            (b.status === "Confirmed" || b.status === "Pending") &&
            new Date(b.bookingTime.start) >= new Date(),
        )
        .sort(
          (a, b) =>
            new Date(a.bookingTime.start).getTime() -
            new Date(b.bookingTime.start).getTime(),
        )
        .slice(0, 5),
    [bookings],
  );

  const stats = [
    {
      label: "Total Revenue",
      value: "$0.00",
      sub: "Coming soon",
      icon: DollarSign,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Active Bookings",
      value: bookingsLoading ? "—" : String(activeBookings.length),
      sub: `${bookings.length} total`,
      icon: CalendarCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Customers",
      value: "—",
      sub: "Coming soon",
      icon: Users,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "Services",
      value: servicesLoading ? "—" : String(services.length),
      sub: `${providersLoading ? "—" : providers.length} providers`,
      icon: Briefcase,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  const quickLinks = [
    {
      title: "Services",
      description: "Manage your service catalog",
      href: `/business-owner/${businessId}/services`,
      gradient: "from-amber-50 to-yellow-50",
      border: "border-amber-200/60",
      icon: Briefcase,
      iconColor: "text-amber-600",
    },
    {
      title: "Providers",
      description: "Manage team members",
      href: `/business-owner/${businessId}/providers`,
      gradient: "from-emerald-50 to-green-50",
      border: "border-emerald-200/60",
      icon: UserPlus,
      iconColor: "text-emerald-600",
    },
    {
      title: "Analytics",
      description: "View business insights",
      href: `/business-owner/${businessId}/analytics`,
      gradient: "from-stone-50 to-stone-100",
      border: "border-stone-200/60",
      icon: BarChart3,
      iconColor: "text-stone-600",
    },
  ];

  const recentActivity = useMemo(() => {
    return bookings.slice(0, 4).map((b) => {
      const cust = b.user || b.customer;
      const customerName = cust
        ? `${cust.firstName} ${cust.lastName}`
        : "A customer";
      const serviceName = b.service?.name ?? "a service";

      let action: string;
      switch (b.status) {
        case "Confirmed":
          action = `${customerName} confirmed a booking for ${serviceName}`;
          break;
        case "Pending":
          action = `${customerName} requested a booking for ${serviceName}`;
          break;
        case "Completed":
          action = `Booking for ${serviceName} with ${customerName} completed`;
          break;
        case "Cancelled":
          action = `Booking for ${serviceName} was cancelled`;
          break;
        default:
          action = `Booking update for ${serviceName}`;
      }

      return {
        id: b.id,
        action,
        time: formatDate(b.createdAt ?? b.bookingTime.start),
        status: b.status,
      };
    });
  }, [bookings]);

  return (
    <div className="bg-[#FDFCFB] min-h-full p-6 lg:p-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="bg-white rounded-2xl border border-stone-200/60 p-5 flex items-start justify-between"
            >
              <div>
                <p className="text-xs text-stone-500 font-medium">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-stone-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{stat.sub}</p>
              </div>
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  stat.iconBg,
                )}
              >
                <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Upcoming Bookings */}
          <motion.div
            variants={item}
            className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/60 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-900">
                Upcoming Bookings
              </h2>
              <button
                onClick={() =>
                  router.push(`/business-owner/${businessId}/bookings`)
                }
                className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {bookingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-stone-50 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No upcoming bookings</p>
                <p className="text-sm mt-1">
                  New bookings will appear here when customers schedule them.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const cfg = statusConfig[booking.status];
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-stone-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4.5 h-4.5 text-stone-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {(booking.user || booking.customer)
                            ? `${(booking.user || booking.customer)!.firstName} ${(booking.user || booking.customer)!.lastName}`
                            : "Customer"}
                        </p>
                        <p className="text-xs text-stone-400 truncate">
                          {booking.service?.name ?? "Service"} &middot;{" "}
                          {formatDate(booking.bookingTime.start)} at{" "}
                          {formatTime(booking.bookingTime.start)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          cfg.bg,
                          cfg.text,
                        )}
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)}
                        />
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            variants={item}
            className="bg-white rounded-2xl border border-stone-200/60 p-6"
          >
            <h2 className="text-sm font-semibold text-stone-900 mb-4">
              Recent Activity
            </h2>

            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-stone-200 mt-2 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-stone-100 rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-stone-50 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => {
                  const cfg =
                    statusConfig[activity.status as Booking["status"]];
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            cfg?.dot ?? "bg-stone-300",
                          )}
                        />
                        {idx < recentActivity.length - 1 && (
                          <div className="w-px flex-1 bg-stone-100 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-stone-700 leading-snug">
                          {activity.action}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-stone-900 mb-3">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <button
                key={link.title}
                onClick={() => router.push(link.href)}
                className={cn(
                  "bg-gradient-to-br rounded-2xl border p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                  link.gradient,
                  link.border,
                )}
              >
                <link.icon className={cn("w-5 h-5 mb-2", link.iconColor)} />
                <p className="text-sm font-semibold text-stone-900">{link.title}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {link.description}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
