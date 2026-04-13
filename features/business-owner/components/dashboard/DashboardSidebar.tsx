"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/utils";
import { BusinessSwitcher } from "@/features/business-owner/components/BusinessSwitcher";
import { Business } from "@/types";

interface DashboardSidebarProps {
  businessId: string;
  businessName: string;
  businessSlug?: string;
  userName: string;
  businesses?: Business[];
  currentBusiness?: Business;
  onBusinessChange?: (business: Business) => void;
  onCreateBusiness?: () => void;
  onAddService?: () => void;
  onAddProvider?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

function getNavItems(businessId: string): NavItem[] {
  const base = `/business-owner/${businessId}`;
  return [
    { label: "Overview", href: base, icon: LayoutDashboard },
    { label: "Calendar", href: `${base}/calendar`, icon: CalendarDays },
    { label: "Services", href: `${base}/services`, icon: Scissors },
    { label: "Providers", href: `${base}/providers`, icon: Users },
    { label: "Bookings", href: `${base}/bookings`, icon: BookOpen, badge: 3 },
    { label: "Analytics", href: `${base}/analytics`, icon: BarChart3 },
    { label: "Settings", href: `${base}/settings`, icon: Settings },
  ];
}

function isActive(pathname: string, href: string, businessId: string): boolean {
  const base = `/business-owner/${businessId}`;
  if (href === base) {
    return pathname === base || pathname === `${base}/`;
  }
  return pathname.startsWith(href);
}

function SidebarContent({
  businessId,
  businessName,
  businessSlug,
  userName,
  businesses = [],
  currentBusiness,
  onBusinessChange,
  onCreateBusiness,
  onAddService,
  onAddProvider,
  onLogout,
  onClose,
}: DashboardSidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const navItems = getNavItems(businessId);
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      {businesses.length > 0 && currentBusiness && onBusinessChange && onCreateBusiness ? (
        <div className="px-4 pb-6 pt-8 border-b border-stone-200/50">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-medium px-2 mb-3">
            Current Business
          </p>
          <BusinessSwitcher
            businesses={businesses}
            currentBusiness={currentBusiness}
            onBusinessChange={onBusinessChange}
            onCreateBusiness={onCreateBusiness}
          />
        </div>
      ) : (
        <div className="px-6 pb-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#C4956A] text-sm font-bold text-white shadow-lg shadow-[#D4A574]/25">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold tracking-tight text-stone-900">
                {businessName}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Dashboard
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 pb-4">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          Quick Actions
        </p>
        <div className="flex gap-2">
          <button
            onClick={onAddService}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-200/60 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-700 transition-all hover:border-[#D4A574]/30 hover:bg-[#D4A574]/5 hover:text-[#D4A574]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </button>
          <button
            onClick={onAddProvider}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-stone-200/60 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-700 transition-all hover:border-[#D4A574]/30 hover:bg-[#D4A574]/5 hover:text-[#D4A574]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Provider
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, businessId);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-[#D4A574]/10 font-semibold text-[#D4A574]"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      active
                        ? "text-[#D4A574]"
                        : "text-stone-400 group-hover:text-stone-600"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        active
                          ? "bg-[#D4A574] text-white"
                          : "bg-stone-200/70 text-stone-500"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* View public site */}
      {businessSlug && (
        <div className="px-4 pb-4">
          <a
            href={`/business/slug/${businessSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200/60 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition-all hover:border-[#D4A574]/30 hover:bg-[#D4A574]/5 hover:text-[#D4A574]"
          >
            <ExternalLink className="h-4 w-4" />
            View Public Site
          </a>
        </div>
      )}

      {/* User profile & logout */}
      <div className="border-t border-stone-200/50 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xs font-bold text-stone-500">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900">
              {userName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Business Owner
            </p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = (props) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-5 z-50 rounded-2xl border border-stone-200/60 bg-white p-3 shadow-lg shadow-stone-200/40 transition-all hover:bg-stone-50 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5 text-stone-700" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-80 shrink-0 border-r border-stone-200/50 bg-white lg:block">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile slide-in sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl lg:hidden"
            >
              <SidebarContent
                {...props}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
