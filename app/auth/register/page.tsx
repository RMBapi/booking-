"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageLoader } from "@/components";
import { useRegister } from "@/features/authentication/hooks";
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

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isRegistering } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [businessSiteSlug, setBusinessSiteSlug] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const returnUrl = searchParams.get("returnUrl");
  const businessName = useMemo(() => formatBusinessName(businessSiteSlug), [businessSiteSlug]);

  useEffect(() => {
    const slug = searchParams.get("businessSiteSlug") || searchParams.get("slug");
    setBusinessSiteSlug(slug);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!businessSiteSlug) {
      setFormError(
        "Customer registration requires a business site. Please access this page from a business site."
      );
      return;
    }

    register({
      ...formData,
      role: "Customer",
      businessSiteSlug,
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

  const handleSignIn = () => {
    if (businessSiteSlug) {
      const next = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : "";
      router.push(
        `/auth/login/customer?businessSiteSlug=${encodeURIComponent(businessSiteSlug)}${next}`
      );
      return;
    }
    router.push("/auth/login");
  };

  const updateField =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  if (!businessSiteSlug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: BRAND.dark }}
      >
        <div className="text-center max-w-md rounded-lg p-10" style={{ backgroundColor: BRAND.card }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <Info className="h-8 w-8" style={{ color: BRAND.accent }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Business Site Required</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            Registration requires a business site. Please access this page from a business
            site to create your customer account.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded text-white text-sm font-bold uppercase tracking-widest"
            style={{ backgroundColor: BRAND.cta }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full pl-12 pr-6 py-4 rounded-lg text-white font-medium border outline-none transition-all focus:ring-2";
  const inputStyle = { backgroundColor: BRAND.card, borderColor: "rgba(255,255,255,0.1)" };
  const labelClass = "text-[11px] font-bold uppercase tracking-widest ml-1";
  const labelStyle = { color: "rgba(255,255,255,0.4)" };
  const iconClass = "absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4";
  const iconStyle = { color: "rgba(255,255,255,0.3)" };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ backgroundColor: BRAND.dark }}
    >
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col p-20 justify-between">
        <div className="absolute inset-0">
          <img src={VISUAL_IMAGE} alt="Visual" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${BRAND.darker}CC 0%, ${BRAND.dark}66 50%, ${BRAND.dark}33 100%)`,
            }}
          />
        </div>

        <div className="relative z-10">
          <h2 className="text-6xl font-black text-white tracking-tight leading-[1.1] uppercase">
            Join
            <br />
            <span style={{ color: BRAND.accent }}>{businessName}.</span>
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
            <p
              className="text-lg font-medium leading-relaxed"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              &ldquo;Joining was the best decision for my personal routine. The ease of booking
              is unmatched.&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Sarah Jenkins</p>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
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
              <h1 className="text-4xl font-black uppercase tracking-tight text-white">
                Create Account
              </h1>
              <p
                className="font-medium text-lg"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Join {businessName} to book services and manage your appointments.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
              <input type="password" name="fake_password" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass} style={labelStyle}>First Name</label>
                  <div className="relative">
                    <User className={iconClass} style={iconStyle} />
                    <input
                      required
                      name="firstName"
                      type="text"
                      placeholder="Jane"
                      className={inputClass}
                      style={inputStyle}
                      value={formData.firstName}
                      onChange={updateField("firstName")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass} style={labelStyle}>Last Name</label>
                  <input
                    required
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    className="w-full px-6 py-4 rounded-lg text-white font-medium border outline-none transition-all focus:ring-2"
                    style={inputStyle}
                    value={formData.lastName}
                    onChange={updateField("lastName")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass} style={labelStyle}>Email Address</label>
                <div className="relative">
                  <Mail className={iconClass} style={iconStyle} />
                  <input
                    required
                    name="customer_email"
                    type="email"
                    placeholder="jane@example.com"
                    autoComplete="off"
                    className={inputClass}
                    style={inputStyle}
                    value={formData.email}
                    onChange={updateField("email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass} style={labelStyle}>Phone Number</label>
                <div className="relative">
                  <Phone className={iconClass} style={iconStyle} />
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+61 00000 00000"
                    className={inputClass}
                    style={inputStyle}
                    value={formData.phone}
                    onChange={updateField("phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass} style={labelStyle}>Password</label>
                <div className="relative">
                  <Lock className={iconClass} style={iconStyle} />
                  <input
                    required
                    minLength={6}
                    name="customer_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-12 pr-14 py-4 rounded-lg text-white font-medium border outline-none transition-all focus:ring-2"
                    style={inputStyle}
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

              <div
                className="p-5 rounded-lg flex items-start gap-4 border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="mt-0.5 p-1.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                >
                  <Info className="w-4 h-4" />
                </div>
                <p
                  className="text-[13px] font-medium leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  You&apos;re creating a customer account for{" "}
                  <span className="font-bold" style={{ color: BRAND.accent }}>
                    {businessName}
                  </span>
                  . Your data is managed securely.
                </p>
              </div>

              {formError && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm font-medium"
                  style={{
                    borderColor: "rgba(239,68,68,0.3)",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    color: "#fca5a5",
                  }}
                >
                  {formError}
                </div>
              )}

              <div className="pt-4 space-y-6">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-5 rounded-lg text-[15px] font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:brightness-110"
                  style={{ backgroundColor: BRAND.cta }}
                >
                  {isRegistering ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <p
                  className="text-center font-medium text-sm"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="font-bold hover:underline underline-offset-4"
                    style={{ color: BRAND.accent }}
                  >
                    Sign in
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterContent />
    </Suspense>
  );
}
