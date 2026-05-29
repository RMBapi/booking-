"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useAuth } from "@/contexts";
import {
  useDashboardSummary,
  useActivityFeed,
} from "@/features/business-owner";
import {
  formatPercentChange,
  formatRelativeTime,
  initialsFromName,
  weekdayLabel,
} from "@/features/business-owner/lib/analyticsHelpers";
import type { DashboardSummary, ActivityItem } from "@/types";
import { formatDate } from "@/utils";
import type { FeatureCode } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function BusinessDashboard() {
  return (
    <FeatureGate feature="view_dashboard" fallback={<AccessDenied />}>
      <DashboardContent />
    </FeatureGate>
  );
}

function DashboardContent() {
  const { me, activeMembership } = useAuth();
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const greeting = useMemo(() => getGreeting(), []);
  const today = new Date();
  const businessName = activeMembership?.name ?? "Your business";

  const { summary, isLoading: summaryLoading } = useDashboardSummary(businessId);
  const { items: activityItems, isLoading: activityLoading } = useActivityFeed(
    businessId,
    { limit: 10 },
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.header variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-text-tertiary tabular">{formatDate(today, "dddd, MMMM D")}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-display mt-1">
            {greeting}, {me?.user.firstName ?? "there"}
          </h1>
          <p className="text-sm text-text-tertiary mt-1.5">
            Here&apos;s what&apos;s happening at <span className="text-text-primary font-medium">{businessName}</span> today.
          </p>
        </div>
      </motion.header>

      {/* Hero stat + secondary stack */}
      <motion.section variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <HeroStat summary={summary} isLoading={summaryLoading} />
        <SecondaryStack summary={summary} isLoading={summaryLoading} />
      </motion.section>

      {/* Quick action command rail */}
      <motion.section variants={item} className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <CommandPill
            href={`/app/${businessId}/bookings`}
            feature="view_bookings"
            icon={<ClipboardList className="h-4 w-4" />}
            title="Today's bookings"
            description="Confirm, cancel, reschedule"
          />
          <CommandPill
            href={`/app/${businessId}/services`}
            feature="manage_services"
            icon={<Wrench className="h-4 w-4" />}
            title="Manage services"
            description="Pricing & availability"
          />
          <CommandPill
            href={`/app/${businessId}/team`}
            feature="manage_team"
            icon={<Users className="h-4 w-4" />}
            title="Invite teammate"
            description="Grant the right access"
          />
          <CommandPill
            href={`/app/${businessId}/calendar`}
            feature="view_calendar"
            icon={<Calendar className="h-4 w-4" />}
            title="View calendar"
            description="Day, week, month"
          />
        </div>
      </motion.section>

      {/* Activity timeline + all-set card */}
      <motion.section variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border-subtle bg-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">Recent activity</h2>
              <p className="text-sm text-text-tertiary mt-0.5">Bookings, reschedules and team changes.</p>
            </div>
            <Link
              href={`/app/${businessId}/bookings`}
              className="text-xs font-medium text-text-tertiary hover:text-text-primary inline-flex items-center gap-0.5 transition-colors group"
            >
              View all
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ActivityTimeline items={activityItems} isLoading={activityLoading} />
        </div>
        <AllSetCard businessId={businessId} />
      </motion.section>

      {/* Week heatmap */}
      <motion.section variants={item} className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">This week at a glance</h2>
          <span className="text-xs text-text-tertiary tabular">{formatDate(today, "MMM YYYY")}</span>
        </div>
        <WeekHeatmap data={summary?.weekHeatmap} isLoading={summaryLoading} />
      </motion.section>
    </motion.div>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function HeroStat({
  summary,
  isLoading,
}: {
  summary: DashboardSummary | null;
  isLoading: boolean;
}) {
  const value = summary?.today.bookingsCount ?? 0;
  const delta = summary?.comparison.bookingsVsLastWeekPercent ?? 0;
  const providers = summary?.today.activeProvidersCount ?? 0;
  const sparkData = (summary?.sparkline ?? []).map((p) => ({
    d: formatDate(p.date, "ddd"),
    v: p.bookings,
  }));
  const deltaLabel = formatPercentChange(delta);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-7"
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Today&apos;s bookings</p>
          {!isLoading && delta !== 0 && (
            <span
              className={
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tabular border " +
                (delta >= 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100/80"
                  : "bg-rose-50 text-rose-700 border-rose-100/80")
              }
            >
              <TrendingUp className={"h-3 w-3 " + (delta < 0 ? "rotate-180" : "")} />
              {deltaLabel} vs last week
            </span>
          )}
        </div>

        <div className="flex items-end gap-3 mt-3">
          {isLoading ? (
            <div className="h-16 w-24 rounded-lg bg-subtle animate-pulse" />
          ) : (
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[64px] leading-none font-bold text-text-primary tabular tracking-display"
            >
              {value}
            </motion.span>
          )}
          <span className="text-sm text-text-tertiary mb-2.5">
            bookings · {providers} provider{providers === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex-1 -mx-2 mt-4 min-h-[100px]">
          {isLoading ? (
            <div className="h-[100px] rounded-lg bg-subtle animate-pulse" />
          ) : sparkData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={sparkData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="url(#sparkStroke)"
                strokeWidth={2}
                fill="url(#sparkFill)"
                dot={false}
                activeDot={{ r: 4, fill: "#6366F1" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[100px] text-xs text-text-tertiary">
              No bookings in the last 7 days
            </div>
          )}
        </div>
      </div>

      {/* Soft gradient flourish in corner */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary-100/60 to-indigo-100/40 blur-3xl" />
    </motion.div>
  );
}

/* ────────────────────── SECONDARY STACK ────────────────────── */

function SecondaryStack({
  summary,
  isLoading,
}: {
  summary: DashboardSummary | null;
  isLoading: boolean;
}) {
  const rows = [
    {
      label: "Active services",
      value: summary?.counts.activeServices ?? 0,
      trend: "stable" as const,
    },
    {
      label: "Team members",
      value: summary?.counts.teamMembers ?? 0,
      trend: "stable" as const,
    },
    {
      label: "New customers (7d)",
      value: summary?.counts.newCustomersLast7Days ?? 0,
      trend: "up" as const,
    },
  ];
  return (
    <div className="lg:col-span-2 rounded-2xl border border-border-subtle bg-surface p-6 flex flex-col">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={
            i < rows.length - 1
              ? "flex items-center justify-between py-3 border-b border-border-subtle"
              : "flex items-center justify-between py-3"
          }
        >
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium">{r.label}</p>
            {isLoading ? (
              <div className="h-8 w-12 mt-1 rounded bg-subtle animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-text-primary tabular tracking-tight mt-0.5">
                {r.value}
              </p>
            )}
          </div>
          {!isLoading && <MiniTrend trend={r.trend} />}
        </div>
      ))}
    </div>
  );
}

function MiniTrend({ trend }: { trend: "up" | "down" | "stable" }) {
  const points = trend === "up" ? "0,18 8,14 16,15 24,8 32,10 40,4" : trend === "down" ? "0,4 8,8 16,7 24,12 32,10 40,16" : "0,10 8,11 16,9 24,11 32,10 40,12";
  const stroke = trend === "up" ? "#15803D" : trend === "down" ? "#B91C1C" : "#8A8A86";
  return (
    <svg width="48" height="22" viewBox="0 0 40 22" fill="none">
      <polyline
        points={points}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ────────────────────── COMMAND PILL ────────────────────── */

function CommandPill({
  href,
  feature,
  icon,
  title,
  description,
}: {
  href: string;
  feature: FeatureCode;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <FeatureGate feature={feature}>
      <Link href={href} className="block">
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="group flex items-center gap-3 rounded-xl border border-border-subtle bg-subtle/50 hover:bg-surface hover:border-primary-200/70 hover:ring-1 hover:ring-primary-100 p-3.5 transition-colors"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface border border-border-subtle text-primary-600 shrink-0 group-hover:border-primary-200 group-hover:bg-gradient-to-br group-hover:from-primary-50 group-hover:to-indigo-50 transition-colors">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
            <p className="text-xs text-text-tertiary truncate">{description}</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-text-quaternary group-hover:text-primary-500 transition-all duration-200 group-hover:translate-x-0.5" />
        </motion.div>
      </Link>
    </FeatureGate>
  );
}

/* ────────────────────── ACTIVITY TIMELINE ────────────────────── */

function ActivityTimeline({
  items,
  isLoading,
}: {
  items: ActivityItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-subtle animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <ActivityEmpty />;
  }

  return (
    <ol className="relative ml-2">
      <span className="absolute left-3 top-1.5 bottom-1.5 w-px bg-border-default" aria-hidden />
      {items.map((a) => {
        const initials = a.actor
          ? initialsFromName(a.actor.firstName, a.actor.lastName)
          : "?";
        return (
          <li
            key={a.id}
            className="group relative pl-9 py-2.5 -mx-2 px-2 rounded-lg hover:bg-subtle/70 transition-colors flex items-start justify-between gap-4"
          >
            <span className="absolute left-2 top-3.5 h-2 w-2 rounded-full bg-surface ring-2 ring-primary-400 shadow-sm" aria-hidden />
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-[10px] font-semibold shrink-0">
                {initials}
              </span>
              <p className="text-sm text-text-secondary leading-relaxed min-w-0">{a.summary}</p>
            </div>
            <span className="text-xs text-text-tertiary tabular shrink-0 mt-1.5">
              {formatRelativeTime(a.occurredAt)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ActivityEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mb-3" aria-hidden>
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeOpacity="0.06" strokeWidth="2" className="text-text-primary" />
        <path d="M18 28h20M28 18v20" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" strokeLinecap="round" className="text-primary-500" />
      </svg>
      <p className="text-sm font-medium text-text-secondary">No activity yet</p>
      <p className="text-xs text-text-tertiary mt-1">Bookings will show up here as they come in.</p>
    </div>
  );
}

/* ────────────────────── ALL-SET CARD ────────────────────── */

function AllSetCard({ businessId }: { businessId: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 via-white to-indigo-50/40 p-6"
    >
      <div className="relative z-10">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-500 text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)]">
          <Sparkles className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-text-primary mt-4 tracking-tight">You&apos;re all set</h3>
        <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
          Booking CRM is ready. Share your customer link from settings to start taking bookings.
        </p>
        <Link
          href={`/app/${businessId}/settings`}
          className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white px-3.5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all"
        >
          Open settings
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-tr from-indigo-200/50 to-primary-200/40 blur-2xl" />
    </motion.div>
  );
}

/* ────────────────────── WEEK HEATMAP ────────────────────── */

function WeekHeatmap({
  data,
  isLoading,
}: {
  data?: DashboardSummary["weekHeatmap"];
  isLoading: boolean;
}) {
  const points = data ?? [];
  const max = Math.max(...points.map((d) => d.bookings), 1);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 h-28 animate-pulse bg-subtle" />
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-4">
      <div className="grid grid-cols-7 gap-2">
        {points.map((d, i) => {
          const intensity = d.bookings / max;
          return (
            <motion.div
              key={d.date}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className={
                "relative flex flex-col items-center gap-2 rounded-xl py-3 transition-colors " +
                (d.isToday ? "bg-gradient-to-br from-primary-50 to-indigo-50/50 border border-primary-200/60" : "")
              }
            >
              <span
                className={
                  "text-[10px] font-semibold uppercase tracking-wider " +
                  (d.isToday ? "text-primary-700" : "text-text-tertiary")
                }
              >
                {weekdayLabel(d.dayOfWeek)}
              </span>
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    d.bookings === 0
                      ? "transparent"
                      : `linear-gradient(135deg, rgba(14,165,233,${0.2 + intensity * 0.6}), rgba(99,102,241,${0.2 + intensity * 0.6}))`,
                  border: d.bookings === 0 ? "1px dashed rgba(15, 15, 14, 0.10)" : "none",
                }}
              >
                <span
                  className={
                    "text-xs font-semibold tabular " +
                    (d.bookings === 0 ? "text-text-quaternary" : "text-white")
                  }
                >
                  {d.bookings}
                </span>
              </div>
              {d.isToday && (
                <span className="absolute -top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 ring-2 ring-surface" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning";
  if (hr < 18) return "Good afternoon";
  return "Good evening";
}
