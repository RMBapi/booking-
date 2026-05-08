"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  CalendarCheck2,
  ChartBar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Cog,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings as SettingsIcon,
  Sparkles,
  UserCircle,
  Users,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { FeatureGate } from "@/components/auth/FeatureGate";
import type { BusinessMembership, FeatureCode } from "@/types";
import { cn } from "@/utils";

interface NavItem {
  href: (businessId: string) => string;
  label: string;
  feature: FeatureCode;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: (id) => `/app/${id}`, label: "Dashboard", feature: "view_dashboard", icon: LayoutDashboard },
  { href: (id) => `/app/${id}/calendar`, label: "Calendar", feature: "view_calendar", icon: Calendar },
  { href: (id) => `/app/${id}/bookings`, label: "Bookings", feature: "view_bookings", icon: ClipboardList },
  { href: (id) => `/app/${id}/services`, label: "Services", feature: "view_services", icon: Wrench },
  { href: (id) => `/app/${id}/contacts`, label: "Contacts", feature: "view_contacts", icon: ScrollText },
  { href: (id) => `/app/${id}/providers`, label: "Providers", feature: "view_providers", icon: UsersRound },
  { href: (id) => `/app/${id}/analytics`, label: "Analytics", feature: "view_analytics", icon: ChartBar },
  { href: (id) => `/app/${id}/team`, label: "Team", feature: "manage_team", icon: Users },
  { href: (id) => `/app/${id}/settings`, label: "Settings", feature: "view_settings", icon: Cog },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New booking from Sarah Chen", time: "2m ago", unread: true },
  { id: 2, title: "John updated his availability", time: "1h ago", unread: true },
  { id: 3, title: "Weekly report is ready", time: "Yesterday", unread: false },
];

const SIDEBAR_KEY = "appShellSidebarCollapsed";

const sidebarSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, activeMembership, activeBusinessId, setActiveBusinessId, logout } =
    useAuth();
  const params = useParams<{ businessId?: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Restore sidebar collapsed state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SIDEBAR_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const urlBusinessId = params?.businessId;

  useEffect(() => {
    if (!me || !urlBusinessId) return;
    const isMember = me.businesses.some((b) => b.id === urlBusinessId);
    if (!isMember) return;
    if (urlBusinessId !== activeBusinessId) {
      setActiveBusinessId(urlBusinessId);
    }
  }, [urlBusinessId, activeBusinessId, me, setActiveBusinessId]);

  const business = useMemo<BusinessMembership | null>(() => {
    if (!me) return null;
    return (
      me.businesses.find((b) => b.id === urlBusinessId) ??
      activeMembership ??
      null
    );
  }, [me, urlBusinessId, activeMembership]);

  if (!me || !business) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const handleSwitch = (id: string) => {
    setActiveBusinessId(id);
    setBusinessMenuOpen(false);
    router.push(`/app/${id}`);
  };

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;
  const planLabel = business.role.replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar — desktop */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={sidebarSpring}
        className="hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden"
      >
        <div className="h-14 flex items-center px-4 border-b border-border-subtle gap-2.5">
          <Link
            href={`/app/${business.id}`}
            className="inline-flex items-center gap-2.5 font-semibold text-text-primary"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 text-white shrink-0 shadow-[0_2px_8px_rgba(14,165,233,0.25)]">
              <CalendarCheck2 className="h-4 w-4" />
            </span>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="truncate tracking-tight"
                >
                  Booking CRM
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <LayoutGroup id="sidebar-nav">
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const href = item.href(business.id);
              const active = pathname === href;
              const Icon = item.icon;
              return (
                <FeatureGate key={item.label} feature={item.feature}>
                  <Link
                    href={href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        transition={sidebarSpring}
                        className="absolute inset-0 rounded-lg bg-subtle"
                      />
                    )}
                    {active && (
                      <motion.span
                        layoutId="nav-bar"
                        transition={sidebarSpring}
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-primary-500 to-indigo-500"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 relative z-10 transition-colors",
                        active ? "text-primary-600" : "text-text-tertiary group-hover:text-text-secondary",
                      )}
                    />
                    {!collapsed && (
                      <span className="relative z-10 truncate">{item.label}</span>
                    )}
                  </Link>
                </FeatureGate>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Workspace card */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="mx-3 mb-3 rounded-xl border border-border-subtle bg-subtle/60 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 text-white text-xs font-semibold shrink-0">
                  {business.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {business.name}
                  </p>
                  <p className="text-[11px] text-text-tertiary capitalize truncate">
                    {planLabel}
                  </p>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-text-quaternary" />
              </div>
              <button
                type="button"
                className="mt-2 w-full text-left text-[11px] font-medium text-primary-700 hover:text-primary-800 transition-colors"
              >
                Upgrade plan →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-border-subtle p-2">
          <button
            onClick={() => setCollapsed((s) => !s)}
            className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-text-tertiary hover:text-text-primary py-1.5 rounded-md hover:bg-subtle transition-colors"
          >
            {collapsed ? (
              <ChevronsRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronsLeft className="h-3.5 w-3.5" />
                Collapse
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 bg-surface flex flex-col shadow-2xl"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border-subtle">
                <span className="inline-flex items-center gap-2.5 font-semibold text-text-primary tracking-tight">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 text-white">
                    <CalendarCheck2 className="h-4 w-4" />
                  </span>
                  Booking CRM
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <LayoutGroup id="mobile-nav">
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                  {NAV_ITEMS.map((item) => {
                    const href = item.href(business.id);
                    const active = pathname === href;
                    const Icon = item.icon;
                    return (
                      <FeatureGate key={item.label} feature={item.feature}>
                        <Link
                          href={href}
                          className={cn(
                            "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            active
                              ? "text-text-primary"
                              : "text-text-secondary hover:text-text-primary",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="mnav-active"
                              transition={sidebarSpring}
                              className="absolute inset-0 rounded-lg bg-subtle"
                            />
                          )}
                          {active && (
                            <motion.span
                              layoutId="mnav-bar"
                              transition={sidebarSpring}
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-primary-500 to-indigo-500"
                            />
                          )}
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 relative z-10",
                              active ? "text-primary-600" : "text-text-tertiary",
                            )}
                          />
                          <span className="relative z-10">{item.label}</span>
                        </Link>
                      </FeatureGate>
                    );
                  })}
                </nav>
              </LayoutGroup>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className={cn("min-h-screen flex flex-col transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-surface/60 backdrop-blur-2xl saturate-150 border-b border-border-subtle">
          <div className="h-14 flex items-center justify-between px-4 lg:px-6 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-subtle transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Business switcher */}
              <div className="relative">
                <button
                  onClick={() => setBusinessMenuOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-subtle transition-colors max-w-[60vw]"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-indigo-500 text-white text-xs font-semibold shrink-0">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold text-text-primary truncate tracking-tight">
                    {business.name}
                  </span>
                  {me.businesses.length > 1 && (
                    <ChevronDown className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {businessMenuOpen && me.businesses.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute left-0 mt-2 w-64 bg-surface/95 backdrop-blur-xl border border-border-subtle rounded-xl shadow-lg py-1.5 text-sm z-30"
                      onMouseLeave={() => setBusinessMenuOpen(false)}
                    >
                      {me.businesses.map((b) => {
                        const inactive = b.status !== "Active";
                        return (
                          <button
                            key={b.id}
                            onClick={() => !inactive && handleSwitch(b.id)}
                            disabled={inactive}
                            title={
                              inactive
                                ? b.status === "Pending"
                                  ? "Membership pending activation"
                                  : "Membership deactivated"
                                : undefined
                            }
                            className={cn(
                              "w-full text-left px-2.5 py-2 mx-1 rounded-lg flex items-center gap-2.5 transition-colors",
                              !inactive && "hover:bg-subtle",
                              b.id === business.id && "bg-subtle",
                              inactive && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-indigo-500 text-white text-xs font-semibold">
                              {b.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-text-primary truncate">
                                {b.name}
                              </p>
                              <p className="text-xs text-text-tertiary truncate capitalize">
                                {b.role.replace(/_/g, " ")}
                              </p>
                            </div>
                            {inactive && (
                              <span
                                className={cn(
                                  "shrink-0 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                                  b.status === "Pending"
                                    ? "border-amber-100 bg-amber-50/60 text-amber-700"
                                    : "border-rose-100 bg-rose-50/60 text-rose-700",
                                )}
                              >
                                {b.status}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Command palette pill (visual) */}
            <button
              type="button"
              aria-label="Search (coming soon)"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-subtle/60 hover:bg-subtle text-text-tertiary text-sm transition-colors min-w-[260px] max-w-[320px]"
            >
              <Command className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search or jump to…</span>
              <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded border border-border-subtle bg-surface text-[10px] font-mono text-text-tertiary">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-1">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((s) => !s)}
                  aria-label="Notifications"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-subtle transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-80 bg-surface/95 backdrop-blur-xl border border-border-subtle rounded-xl shadow-lg z-30"
                      onMouseLeave={() => setNotifOpen(false)}
                    >
                      <div className="px-3 py-2.5 border-b border-border-subtle flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary">Notifications</p>
                        <span className="text-[11px] text-text-tertiary">{unreadCount} new</span>
                      </div>
                      <ul className="py-1">
                        {MOCK_NOTIFICATIONS.map((n) => (
                          <li
                            key={n.id}
                            className="px-3 py-2.5 hover:bg-subtle transition-colors cursor-default flex items-start gap-2.5"
                          >
                            <span
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                                n.unread ? "bg-primary-500" : "bg-border-default",
                              )}
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-text-primary leading-snug">{n.title}</p>
                              <p className="text-[11px] text-text-tertiary mt-0.5 tabular">{n.time}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((s) => !s)}
                  className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-subtle transition-colors"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 text-white font-semibold text-sm shadow-[0_2px_8px_rgba(14,165,233,0.2)]">
                    {me.user.firstName.charAt(0)}
                  </span>
                  <span className="hidden sm:inline text-sm font-medium text-text-primary">
                    {me.user.firstName}
                  </span>
                  <ChevronDown className="hidden sm:inline h-3.5 w-3.5 text-text-tertiary" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-60 bg-surface/95 backdrop-blur-xl border border-border-subtle rounded-xl shadow-lg z-30 overflow-hidden"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="px-3 py-3 border-b border-border-subtle">
                        <p className="text-[11px] uppercase tracking-wider text-text-quaternary font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                          {me.user.firstName} {me.user.lastName ?? ""}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                          {me.user.email}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href={`/app/${business.id}/settings`}
                          className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg hover:bg-subtle text-text-secondary hover:text-text-primary text-sm transition-colors"
                        >
                          <UserCircle className="h-4 w-4 text-text-tertiary" />
                          Profile
                        </Link>
                        <Link
                          href={`/app/${business.id}/settings`}
                          className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg hover:bg-subtle text-text-secondary hover:text-text-primary text-sm transition-colors"
                        >
                          <SettingsIcon className="h-4 w-4 text-text-tertiary" />
                          Settings
                        </Link>
                      </div>
                      <button
                        onClick={async () => {
                          await logout();
                          router.replace("/login");
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-rose-50/60 text-rose-700/80 hover:text-rose-700 text-sm border-t border-border-subtle transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-10 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
