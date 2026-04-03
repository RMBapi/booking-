"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader } from "@/components";
import { useLogin } from "@/features/authentication/hooks";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/publicBrand";

const VISUAL_IMAGE =
  "https://images.unsplash.com/photo-1723101917533-4fc9149c3684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

const formatBusinessName = (slug: string | null) => {
  if (!slug) return "";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSession, isLoading: authLoading } = useRoleAuth();
  const { login, isLogging, errorMessage, clearError } = useLogin();

  const [businessSiteSlug, setBusinessSiteSlug] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const returnUrl = searchParams.get("returnUrl");
  const businessName = formatBusinessName(businessSiteSlug);

  useEffect(() => {
    const slug = searchParams.get("businessSiteSlug") || searchParams.get("slug");
    setBusinessSiteSlug(slug);
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading) {
      const { user, token } = getSession("Customer");
      if (user && token) {
        router.replace(returnUrl || "/customer/dashboard");
      }
    }
  }, [authLoading, getSession, router, returnUrl]);

  if (authLoading) return <PageLoader />;

  if (!businessSiteSlug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: BRAND.dark }}
      >
        <div className="text-center max-w-md" style={{ backgroundColor: BRAND.card }}>
          <div className="p-10 rounded-lg">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <AlertCircle className="h-8 w-8" style={{ color: BRAND.accent }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Business Site Required</h1>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
              Customer login requires a business site. Please access this page from a business
              site or include the business site slug in the URL.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-6 py-3 rounded text-white text-sm font-bold uppercase tracking-widest"
              style={{ backgroundColor: BRAND.cta }}
            >
              Go to Login Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();
    login({
      ...formData,
      role: "Customer",
      businessSiteSlug: businessSiteSlug!,
    });
  };

  const handleBack = () => {
    if (returnUrl) {
      router.push(returnUrl);
      return;
    }
    if (businessSiteSlug) {
      router.push(`/business/slug/${businessSiteSlug}`);
      return;
    }
    router.push("/auth/login");
  };

  const handleSignUp = () => {
    if (businessSiteSlug) {
      const next = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : "";
      router.push(
        `/auth/register?businessSiteSlug=${encodeURIComponent(businessSiteSlug)}${next}`
      );
      return;
    }
    router.push("/auth/register");
  };

  const updateField =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (formError) setFormError(null);
      if (errorMessage) clearError();
    };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: BRAND.dark }}>
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col p-20 justify-between">
        <div className="absolute inset-0">
          <img
            src={VISUAL_IMAGE}
            alt="Business visual"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${BRAND.darker}CC 0%, ${BRAND.dark}66 50%, ${BRAND.dark}33 100%)`,
            }}
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-6xl font-black text-white tracking-tight leading-[1.1] uppercase">
            Welcome
            <br />
            <span style={{ color: BRAND.accent }}>Back.</span>
          </h2>
        </div>

        <div className="relative z-10 max-w-md">
          <div
            className="p-8 rounded-lg space-y-4 border"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.85)" }} className="text-lg font-medium leading-relaxed">
              &ldquo;The booking process is seamless. I can schedule my appointments in seconds.&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              />
              <div>
                <p className="text-white font-bold text-sm">Regular Customer</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Member since 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-24 justify-center">
        <div className="max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <button
                onClick={handleBack}
                type="button"
                className="group flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-[0.2em] mb-8"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back
              </button>

              <h1 className="text-4xl font-black tracking-tight text-white uppercase">
                Sign In
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)" }} className="font-medium text-lg">
                {businessName
                  ? `Log in to your account at ${businessName}`
                  : "Sign in to book services"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
              {(formError || errorMessage) && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm font-medium"
                  style={{
                    borderColor: "rgba(239,68,68,0.3)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    color: "#fca5a5",
                  }}
                >
                  {formError || errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <label
                  className="text-[11px] font-bold uppercase tracking-widest ml-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-12 pr-6 py-4 rounded-lg text-white font-medium border outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: BRAND.card,
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                    value={formData.email}
                    onChange={updateField("email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-[11px] font-bold uppercase tracking-widest ml-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                  <input
                    required
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-12 pr-14 py-4 rounded-lg text-white font-medium border outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: BRAND.card,
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                    value={formData.password}
                    onChange={updateField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-6">
                <button
                  type="submit"
                  disabled={isLogging}
                  className="w-full py-5 rounded-lg text-[15px] font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: BRAND.cta }}
                  onMouseEnter={(e) => {
                    if (!isLogging) e.currentTarget.style.backgroundColor = BRAND.ctaHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND.cta;
                  }}
                >
                  {isLogging ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p className="text-center font-medium text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={handleSignUp}
                    className="font-bold hover:underline underline-offset-4"
                    style={{ color: BRAND.accent }}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CustomerLoginContent />
    </Suspense>
  );
}
