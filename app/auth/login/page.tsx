"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";
import { Building2, Shield, Sparkles, Users } from "lucide-react";
import { Card } from "@/components";
import Link from "next/link";

const roleCards = [
  {
    title: "Customer",
    href: "/auth/login/customer",
    description: "Access bookings and track your activity.",
    icon: Users,
    accentClass: "from-emerald-100 to-emerald-50 text-emerald-700",
  },
  {
    title: "Service Provider",
    href: "/auth/login/service-provider",
    description: "Manage appointments, schedules, and services.",
    icon: Sparkles,
    accentClass: "from-sky-100 to-sky-50 text-sky-700",
  },
  {
    title: "Business Owner",
    href: "/auth/login/business-owner",
    description: "Monitor businesses, providers, and requests.",
    icon: Building2,
    accentClass: "from-amber-100 to-amber-50 text-amber-700",
  },
  {
    title: "Super Admin",
    href: "/auth/login/super-admin",
    description: "Platform-level controls and owner management.",
    icon: Shield,
    accentClass: "from-violet-100 to-violet-50 text-violet-700",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect when user is logged in
  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      // Redirect to first available role dashboard
      if (userRoles.includes("Super_Admin")) {
        router.replace("/super-admin");
      } else if (userRoles.includes("Business_owner")) {
        router.replace("/business-owner");
      } else if (userRoles.includes("Customer")) {
        router.replace("/customer/dashboard");
      } else if (userRoles.includes("Service_Provider")) {
        router.replace("/service-provider/dashboard");
      }
      // If user has no recognized role, don't redirect - stay on login page
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth or redirecting
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#ddeaf7_0%,#eef3f8_45%,#f8fafc_100%)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 md:px-6 md:py-14 bg-[radial-gradient(circle_at_top,#ddeaf7_0%,#eef3f8_45%,#f8fafc_100%)]">
      <Card className="mx-auto w-full max-w-3xl border border-white/60 bg-white/95 shadow-[0_25px_60px_rgba(15,23,42,0.1)] backdrop-blur" padding="lg">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-sky-800 text-3xl font-black text-white shadow-xl shadow-primary-900/20">
            C
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Choose your login portal</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roleCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="group">
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-900/10">
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accentClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm font-medium text-gray-600">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Do not have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary-700 hover:text-primary-800"
            >
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
