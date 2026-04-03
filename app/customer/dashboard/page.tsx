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
import { BRAND } from "@/lib/publicBrand";

export default function CustomerDashboard() {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading } = useRoleAuth();
  const customerSession = getSession("Customer");
  const { user, token } = customerSession;

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login");
    }
  }, [token, isLoading, router]);

  if (isLoading) return <PageLoader />;
  if (!user || !token) return null;

  const businessSlug =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_businessSiteSlug")
      : null;

  const handleLogout = () => {
    logoutRole("Customer");
    if (businessSlug) {
      router.push(`/business/slug/${businessSlug}`);
    } else {
      router.push("/auth/login");
    }
  };

  const handleBack = () => {
    if (businessSlug) {
      router.push(`/business/slug/${businessSlug}`);
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
        if (businessSlug) router.push(`/business/slug/${businessSlug}`);
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
    <div className="min-h-screen text-white" style={{ backgroundColor: BRAND.dark }}>
      {/* Top navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-16"
        style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest mr-4 transition-colors"
            style={{ color: "#888" }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span
            className="font-black text-lg uppercase tracking-[0.12em]"
            style={{ color: BRAND.dark }}
          >
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm font-semibold" style={{ color: BRAND.dark }}>
            {user.firstName} {user.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-all"
            style={{ backgroundColor: BRAND.card, color: "white" }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="pt-16">
        {/* Welcome Hero */}
        <section className="py-16 px-6 lg:px-16" style={{ backgroundColor: BRAND.darker }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: BRAND.accent }}
              >
                Welcome back
              </p>
              <h1
                className="font-black uppercase text-white mb-4"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  letterSpacing: "0.04em",
                }}
              >
                {user.firstName} {user.lastName}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)" }} className="text-lg font-medium">
                Manage your bookings, browse services, and update your profile.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 px-6 lg:px-16" style={{ backgroundColor: BRAND.dark }}>
          <div className="max-w-6xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
              style={{ color: BRAND.accent }}
            >
              Quick Actions
            </p>
            <h2
              className="font-black uppercase text-white mb-10"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "0.05em" }}
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
                  style={{ backgroundColor: BRAND.card }}
                >
                  <div
                    className="w-14 h-14 rounded flex items-center justify-center mb-6"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <action.icon className="h-7 w-7" style={{ color: BRAND.accent }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                  <p
                    className="text-sm leading-relaxed mb-6 flex-1"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {action.description}
                  </p>
                  <button
                    onClick={action.onClick}
                    className="w-full py-3 rounded text-sm font-bold uppercase tracking-widest border transition-all"
                    style={{
                      borderColor: "rgba(255,255,255,0.4)",
                      color: "white",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.color = BRAND.dark;
                      e.currentTarget.style.borderColor = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
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
        <section className="py-20 px-6 lg:px-16" style={{ backgroundColor: BRAND.darker }}>
          <div className="max-w-6xl mx-auto">
            <p
              className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
              style={{ color: BRAND.accent }}
            >
              Your Activity
            </p>
            <h2
              className="font-black uppercase text-white mb-10"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "0.05em" }}
            >
              RECENT BOOKINGS
            </h2>

            <div className="rounded p-12 text-center" style={{ backgroundColor: BRAND.card }}>
              <div
                className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Calendar className="h-8 w-8" style={{ color: "rgba(255,255,255,0.3)" }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">No bookings yet</h3>
              <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                Start booking services to see your appointment history here.
              </p>
              <button
                onClick={() => {
                  if (businessSlug) router.push(`/business/slug/${businessSlug}`);
                }}
                className="px-8 py-3 rounded text-white text-sm font-bold uppercase tracking-widest transition-all"
                style={{ backgroundColor: BRAND.cta }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.ctaHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.cta)}
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
        style={{ backgroundColor: BRAND.darker, borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
          <div
            className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
