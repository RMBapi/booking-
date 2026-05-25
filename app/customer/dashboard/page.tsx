"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Calendar,
  User,
  LogOut,
  ChevronLeft,
  Clock,
  Star,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader } from "@/components";
import { motion } from "framer-motion";
import { ELEGANZA } from "@/lib/publicBrand";

export default function CustomerDashboard() {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading } = useRoleAuth();
  const customerSession = getSession("Customer");
  const { user, token } = customerSession;

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/customer");
    }
  }, [token, isLoading, router]);

  if (isLoading) return <PageLoader />;
  if (!user || !token) return null;

  const businessSlug =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_businessSiteSlug")
      : null;
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG || null;
  const resolvedSlug = businessSlug || envSlug;

  const handleLogout = () => {
    logoutRole("Customer");
    if (resolvedSlug) {
      router.push(`/business/slug/${resolvedSlug}`);
    } else {
      router.push("/");
    }
  };

  const handleBack = () => {
    if (resolvedSlug) {
      router.push(`/business/slug/${resolvedSlug}`);
    } else {
      router.push("/");
    }
  };

  const quickActions = [
    {
      icon: ShoppingBag,
      title: "Browse Services",
      description: "Explore services and book your next appointment online.",
      buttonLabel: "Browse Now",
      onClick: () => {
        if (resolvedSlug) {
          router.push(`/business/slug/${resolvedSlug}#services-section`);
        }
      },
    },
    {
      icon: Calendar,
      title: "My Bookings",
      description: "Check your upcoming and past appointments at a glance.",
      buttonLabel: "View Bookings",
      onClick: () => {},
    },
    {
      icon: User,
      title: "My Profile",
      description: "Manage your account settings and personal preferences.",
      buttonLabel: "Edit Profile",
      onClick: () => {},
    },
  ];

  return (
    <div
      className="min-h-screen text-[#222222]"
      style={{ backgroundColor: ELEGANZA.background }}
    >
      {/* Top navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-16"
        style={{
          backgroundColor: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${ELEGANZA.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest mr-4 transition-colors"
            style={{ color: ELEGANZA.inkMuted }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span
            className="font-black text-lg uppercase tracking-[0.12em]"
            style={{ color: ELEGANZA.ink }}
          >
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="hidden md:block text-sm font-semibold"
            style={{ color: ELEGANZA.ink }}
          >
            {user.firstName} {user.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
            style={{ border: `1px solid ${ELEGANZA.ink}`, color: ELEGANZA.ink }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ELEGANZA.ink;
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = ELEGANZA.ink;
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* Welcome Hero */}
        <section
          className="py-16 px-6 lg:px-16"
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: ELEGANZA.inkMuted }}
              >
                Welcome back
              </p>
              <h1
                className="font-black uppercase mb-4"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  letterSpacing: "0.04em",
                  color: ELEGANZA.ink,
                }}
              >
                {user.firstName} {user.lastName}
              </h1>
              <p style={{ color: ELEGANZA.inkMuted }} className="text-lg font-medium">
                Manage your bookings, browse services, and update your profile.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 px-6 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
              style={{ color: ELEGANZA.inkMuted }}
            >
              Quick Actions
            </p>
            <h2
              className="font-black uppercase mb-10"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "0.05em",
                color: ELEGANZA.ink,
              }}
            >
              WHAT WOULD YOU LIKE TO DO?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, idx) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col rounded p-8"
                  style={{
                    backgroundColor: ELEGANZA.surface,
                    border: `1px solid ${ELEGANZA.border}`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded flex items-center justify-center mb-6"
                    style={{ backgroundColor: ELEGANZA.surfaceMuted }}
                  >
                    <action.icon className="h-7 w-7" style={{ color: ELEGANZA.ink }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: ELEGANZA.ink }}>
                    {action.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-6 flex-1"
                    style={{ color: ELEGANZA.inkMuted }}
                  >
                    {action.description}
                  </p>
                  <button
                    onClick={action.onClick}
                    className="w-full py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border transition-colors"
                    style={{
                      borderColor: ELEGANZA.ink,
                      color: ELEGANZA.ink,
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = ELEGANZA.ink;
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.borderColor = ELEGANZA.ink;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = ELEGANZA.ink;
                      e.currentTarget.style.borderColor = ELEGANZA.ink;
                    }}
                  >
                    {action.buttonLabel}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Bookings */}
        <section
          className="py-20 px-6 lg:px-16"
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        >
          <div className="max-w-6xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
              style={{ color: ELEGANZA.inkMuted }}
            >
              Your Activity
            </p>
            <h2
              className="font-black uppercase mb-10"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "0.05em",
                color: ELEGANZA.ink,
              }}
            >
              RECENT BOOKINGS
            </h2>

            <div
              className="rounded p-12 text-center"
              style={{
                backgroundColor: ELEGANZA.surface,
                border: `1px solid ${ELEGANZA.border}`,
              }}
            >
              <div
                className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: ELEGANZA.surfaceMuted }}
              >
                <Calendar className="h-8 w-8" style={{ color: ELEGANZA.inkMuted }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: ELEGANZA.ink }}>
                No bookings yet
              </h3>
              <p className="text-sm mb-8" style={{ color: ELEGANZA.inkMuted }}>
                Start booking services to see your appointment history here.
              </p>
              <button
                onClick={() => {
                  if (businessSlug) router.push(`/business/slug/${businessSlug}`);
                }}
                className="px-8 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
                style={{ backgroundColor: ELEGANZA.cta }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ELEGANZA.cta)}
              >
                Browse Services
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-10 px-6 lg:px-16"
        style={{ backgroundColor: ELEGANZA.surface, borderColor: ELEGANZA.border }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: ELEGANZA.inkMuted }}>
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
          <div
            className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: ELEGANZA.inkMuted }}
          >
            <a href="#" className="transition-colors hover:text-[#222222]">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-[#222222]">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
