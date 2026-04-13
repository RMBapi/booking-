"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts";
import { useLogin } from "@/features/authentication/hooks";
import { getUserRoles } from "@/utils";
import { PageLoader } from "@/components";

function SuperAdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const { login, isLogging, errorMessage, clearError } = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      if (userRoles.includes("Super_Admin")) {
        router.replace("/super-admin");
      } else {
        router.replace("/auth/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    login({ ...formData, role: "Super_Admin" });
  };

  const updateField =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errorMessage) clearError();
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-primary-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-[420px]"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-10">
          {/* Header */}
          <div className="text-center mb-9">
            <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin Access
            </h1>
            <p className="mt-1.5 text-sm text-white/40">
              Super Admin credentials required
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400"
            >
              {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-0.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25" />
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/[0.06] text-white font-medium text-[15px] placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  value={formData.email}
                  onChange={updateField("email")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-0.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25" />
                <input
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-white/10 bg-white/[0.06] text-white font-medium text-[15px] placeholder:text-white/25 outline-none transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  value={formData.password}
                  onChange={updateField("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
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
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-all hover:from-violet-500 hover:to-violet-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
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
        </div>

        <p className="mt-6 text-center text-sm text-white/30">
          Not an admin?{" "}
          <button
            onClick={() => router.push("/auth/login")}
            className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Go to regular login
          </button>
        </p>
      </motion.div>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SuperAdminLoginContent />
    </Suspense>
  );
}

//Bapi
