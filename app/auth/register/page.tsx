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
import { UserRole } from "@/types";

const VISUAL_IMAGE =
  "https://images.unsplash.com/photo-1601257774527-a5b80a1f13ac?auto=format&fit=crop&q=80&w=1200";

const formatBusinessName = (slug: string | null) => {
  if (!slug) return "Quiet Harbor";
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
    role: "Customer" as UserRole,
  });

  const returnUrl = searchParams.get("returnUrl");
  const businessName = useMemo(() => formatBusinessName(businessSiteSlug), [businessSiteSlug]);

  useEffect(() => {
    const slug = searchParams.get("businessSiteSlug") || searchParams.get("slug");
    setBusinessSiteSlug(slug);

    if (slug) {
      setFormData((prev) => ({ ...prev, role: "Customer" as UserRole }));
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.role === "Customer" && !businessSiteSlug) {
      setFormError(
        "Customer registration requires a business site slug. Open this page from a business public site."
      );
      return;
    }

    const payload = {
      ...formData,
      ...(formData.role === "Customer" && businessSiteSlug ? { businessSiteSlug } : {}),
    };

    register(payload);
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
      router.push(`/auth/login/customer?businessSiteSlug=${encodeURIComponent(businessSiteSlug)}${next}`);
      return;
    }

    router.push("/auth/login");
  };

  const updateField =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const customerWithoutSlug = formData.role === "Customer" && !businessSiteSlug;
  const roleLabel =
    formData.role === "Service_Provider"
      ? "service provider"
      : formData.role === "Business_owner"
      ? "business owner"
      : "customer";

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-stone-100 relative overflow-hidden flex-col p-20 justify-between">
        <div className="absolute inset-0">
          <img src={VISUAL_IMAGE} alt="Minimalist Lifestyle" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-stone-900/10" />
        </div>

        <div className="relative z-10">
          <h2 className="text-6xl font-semibold text-white tracking-tight leading-[1.1]">
            Elevate your <br />
            <span className="italic font-normal">well-being</span> <br />
            with {businessName}.
          </h2>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[40px] space-y-4">
            <p className="text-white/90 text-lg font-medium leading-relaxed">
              "Joining this community was the best decision for my personal routine. The ease of booking is unmatched."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Sarah Jenkins</p>
                <p className="text-white/60 text-xs font-medium">Member since 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-24 justify-center">
        <div className="max-w-md mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="space-y-4">
              <button
                onClick={handleBack}
                type="button"
                className="group flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors font-bold text-xs uppercase tracking-[0.2em] mb-8"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back
              </button>
              <h1 className="text-4xl font-semibold tracking-tight text-stone-900">
                {businessSiteSlug ? "Create Account" : "Create Account"}
              </h1>
              <p className="text-stone-500 font-medium text-lg">
                Join us to book services and manage your rituals with ease.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Autofill traps: reduce browser prefilling on actual form fields */}
              <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
              <input type="password" name="fake_password" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />
              {!businessSiteSlug && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={updateField("role")}
                    className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Service_Provider">Service Provider</option>
                    <option value="Business_owner">Business Owner</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                    <input
                      required
                      name="firstName"
                      type="text"
                      placeholder="Jane"
                      className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
                      value={formData.firstName}
                      onChange={updateField("firstName")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    required
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
                    value={formData.lastName}
                    onChange={updateField("lastName")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <input
                    required
                    name="customer_email"
                    type="email"
                    placeholder="jane@example.com"
                    autoComplete="off"
                    className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
                    value={formData.email}
                    onChange={updateField("email")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+91 00000 00000"
                    className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
                    value={formData.phone}
                    onChange={updateField("phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <input
                    required
                    minLength={6}
                    name="customer_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full pl-12 pr-14 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
                    value={formData.password}
                    onChange={updateField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-100 p-5 rounded-2xl flex items-start gap-4">
                <div className="mt-0.5 p-1.5 bg-stone-200/50 text-stone-400 rounded-lg">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-[13px] text-stone-500 font-medium leading-relaxed">
                  {businessSiteSlug ? (
                    <>
                      You&apos;re creating a customer account for{" "}
                      <span className="text-stone-900 font-bold">{businessName}</span>. Your data is managed securely.
                    </>
                  ) : (
                    <>
                      You&apos;re creating a <span className="text-stone-900 font-bold">{roleLabel}</span> account.
                      Your data is managed securely.
                    </>
                  )}
                </p>
              </div>

              {formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div className="pt-4 space-y-6">
                <button
                  type="submit"
                  disabled={isRegistering || customerWithoutSlug}
                  className="w-full py-5 bg-stone-900 text-white rounded-2xl text-[15px] font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed"
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

                <p className="text-center text-stone-400 font-medium text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="text-stone-900 font-bold hover:underline underline-offset-4"
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
