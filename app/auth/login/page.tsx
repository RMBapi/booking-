"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts";
import { useLogin } from "@/features/authentication/hooks";
import { getUserRoles } from "@/utils";
import { PageLoader } from "@/components";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const { login, isLogging, errorMessage, clearError } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const businessSiteSlug =
    searchParams.get("businessSiteSlug") || searchParams.get("slug");
  const returnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      if (userRoles.includes("Super_Admin")) {
        router.replace("/super-admin");
      } else if (userRoles.includes("Business_owner")) {
        router.replace("/business-owner");
      } else if (userRoles.includes("Customer")) {
        router.replace(returnUrl || "/customer/dashboard");
      } else if (userRoles.includes("Service_Provider")) {
        router.replace("/service-provider/dashboard");
      }
    }
  }, [user, isLoading, router, returnUrl]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    login({
      ...formData,
      ...(businessSiteSlug
        ? { role: "Customer" as const, businessSiteSlug }
        : {}),
    });
  };

  const updateField =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errorMessage) clearError();
    };

  const formatSlug = (slug: string) =>
    slug
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#faf9f6]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-600/20" />
        <div className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-primary-400/10" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative z-10 p-16 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-20">
              <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-lg font-bold text-white">
                C
              </div>
              <span className="text-white/80 font-semibold tracking-wide text-sm">
                Cuebites CRM
              </span>
            </div>

            <h1 className="text-5xl font-bold text-white tracking-tight leading-[1.15]">
              Welcome
              <br />
              <span className="text-primary-300">back.</span>
            </h1>
            <p className="mt-6 text-primary-200/70 text-lg max-w-sm leading-relaxed">
              Manage your bookings, services, and business — all from one
              place.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/10 p-7">
              <p className="text-white/80 text-[15px] leading-relaxed font-medium">
                &ldquo;The dashboard gives me complete visibility. Managing
                bookings and providers has never been easier.&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-400/30 flex items-center justify-center text-xs font-bold text-white">
                  JD
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    Jane Doe
                  </p>
                  <p className="text-primary-300/60 text-xs">
                    Business Owner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden mb-10 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-primary-900/20">
                C
              </div>
              <span className="text-gray-800 font-semibold tracking-wide text-sm">
                Cuebites CRM
              </span>
            </div>

            <div className="mb-9">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Sign in
              </h2>
              <p className="mt-2 text-gray-500 text-[15px]">
                {businessSiteSlug
                  ? `Log in to your account at ${formatSlug(businessSiteSlug)}`
                  : "Enter your credentials to access your dashboard"}
              </p>
            </div>

            {/* Error */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl bg-danger-50 border border-danger-100 px-4 py-3.5 text-sm font-medium text-danger-700"
              >
                {errorMessage}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-600 ml-0.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-medium text-[15px] placeholder:text-gray-400 outline-none transition-all focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                    value={formData.email}
                    onChange={updateField("email")}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-600 ml-0.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 font-medium text-[15px] placeholder:text-gray-400 outline-none transition-all focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                    value={formData.password}
                    onChange={updateField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLogging}
                className="w-full mt-2 py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-primary-900/10"
              >
                {isLogging ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-7 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  businessSiteSlug
                    ? `/auth/register?businessSiteSlug=${encodeURIComponent(businessSiteSlug)}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ""}`
                    : "/auth/register"
                }
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign up
              </Link>
            </p>

            {/* Super admin link */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <Link
                href="/auth/login/super-admin"
                className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors group"
              >
                <Shield className="w-4 h-4" />
                <span>Super Admin Login</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginContent />
    </Suspense>
  );
}
