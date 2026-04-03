"use client";

import React from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { B, STEP_TRANSITION } from "../constants";
import type { Provider, ServiceInfo } from "../types";

interface ClientStepProps {
  service: ServiceInfo;
  selectedProvider: Provider | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  isLogin: boolean;
  showPass: boolean;
  loginEmail: string;
  loginPassword: string;
  regName: string;
  regEmail: string;
  regPhone: string;
  agreed: boolean;
  subscribe: boolean;
  submitting: boolean;
  onToggleLogin: (v: boolean) => void;
  onToggleShowPass: () => void;
  onLoginEmailChange: (v: string) => void;
  onLoginPasswordChange: (v: string) => void;
  onRegNameChange: (v: string) => void;
  onRegEmailChange: (v: string) => void;
  onRegPhoneChange: (v: string) => void;
  onToggleAgreed: () => void;
  onToggleSubscribe: () => void;
  onSubmit: () => void;
}

export const ClientStep = React.memo(function ClientStep({
  service,
  selectedProvider,
  selectedDate,
  selectedTime,
  isLogin,
  showPass,
  loginEmail,
  loginPassword,
  regName,
  regEmail,
  regPhone,
  agreed,
  subscribe,
  submitting,
  onToggleLogin,
  onToggleShowPass,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegNameChange,
  onRegEmailChange,
  onRegPhoneChange,
  onToggleAgreed,
  onToggleSubscribe,
  onSubmit,
}: ClientStepProps) {
  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <motion.div {...STEP_TRANSITION} key="step-client">
      <h2
        className="font-black uppercase text-white mb-2 tracking-widest"
        style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}
      >
        PLEASE SIGN IN TO CONTINUE
      </h2>
      <p className="text-sm mb-10" style={{ color: B.muted }}>
        {service.name}
        {selectedProvider ? ` - ${selectedProvider.name}` : ""}
        {dateStr ? ` - ${dateStr}` : ""}
        {selectedTime ? ` at ${selectedTime}` : ""}
      </p>

      <div className="max-w-3xl mx-auto">
        {/* Social login */}
        <div
          className="flex items-center justify-between p-4 rounded mb-6 border"
          style={{ backgroundColor: B.card, borderColor: B.border }}
        >
          <span className="text-sm" style={{ color: B.muted }}>
            You can use social media to continue
          </span>
          <div className="flex items-center gap-3">
            {["Google", "Facebook"].map((provider) => (
              <button
                key={provider}
                className="w-12 h-12 rounded flex flex-col items-center justify-center border transition-all"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.14)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.06)")
                }
              >
                <span
                  className="text-[9px] font-bold mt-0.5"
                  style={{ color: B.muted }}
                >
                  {provider}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: B.border }} />
          <div
            className="flex rounded overflow-hidden border"
            style={{ borderColor: B.border }}
          >
            <button
              onClick={() => onToggleLogin(true)}
              className="px-5 py-2 text-xs font-black uppercase tracking-widest transition-all"
              style={{
                backgroundColor: isLogin ? B.accent : "transparent",
                color: isLogin ? B.dark : B.muted,
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => onToggleLogin(false)}
              className="px-5 py-2 text-xs font-black uppercase tracking-widest transition-all"
              style={{
                backgroundColor: !isLogin ? B.accent : "transparent",
                color: !isLogin ? B.dark : B.muted,
              }}
            >
              Sign Up
            </button>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: B.border }} />
        </div>

        {/* Forms grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sign In card */}
          <div
            className="rounded border p-6 space-y-5"
            style={{ backgroundColor: B.card, borderColor: B.border }}
          >
            <h3
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: B.accent }}
            >
              {isLogin ? "Existing Clients" : "Already Have an Account?"}
            </h3>
            <p className="text-xs" style={{ color: B.muted }}>
              {isLogin
                ? "Please sign in here"
                : "Sign in to your account instead"}
            </p>

            <div className="space-y-3">
              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                  style={{ color: B.muted }}
                >
                  Email:
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => onLoginEmailChange(e.target.value)}
                  className="w-full px-4 py-3 rounded border text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: B.white,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = B.accent)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                  }
                />
              </div>
              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                  style={{ color: B.muted }}
                >
                  Password:
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => onLoginPasswordChange(e.target.value)}
                    className="w-full px-4 py-3 rounded border text-sm outline-none pr-10 transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: B.white,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = B.accent)}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                    }
                  />
                  <button
                    type="button"
                    onClick={onToggleShowPass}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: B.muted }}
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  className="text-xs mt-2 transition-colors"
                  style={{ color: B.muted }}
                >
                  Forgot password?
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "rgba(255,255,255,0.25)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                  }}
                />
                <span className="text-xs" style={{ color: B.muted }}>
                  Remember me (Cookies used)
                </span>
              </label>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting}
              className="w-full py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: B.cta, color: B.white }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = B.ctaHov)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = B.cta)
              }
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Sign In And Continue"
              )}
            </button>
          </div>

          {/* Sign Up card */}
          <div
            className="rounded border p-6 space-y-5"
            style={{ backgroundColor: B.card, borderColor: B.border }}
          >
            <h3
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: B.accent }}
            >
              New Clients
            </h3>
            <p className="text-xs" style={{ color: B.muted }}>
              Please sign up here
            </p>

            <div className="space-y-3">
              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                  style={{ color: B.muted }}
                >
                  Name: <span style={{ color: B.accent }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={regName}
                  onChange={(e) => onRegNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded border text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: B.white,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = B.accent)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                  }
                />
              </div>
              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                  style={{ color: B.muted }}
                >
                  Email: <span style={{ color: B.accent }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={regEmail}
                  onChange={(e) => onRegEmailChange(e.target.value)}
                  className="w-full px-4 py-3 rounded border text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: B.white,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = B.accent)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                  }
                />
              </div>
              <div>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                  style={{ color: B.muted }}
                >
                  Phone:
                </label>
                <div className="flex gap-2">
                  <div
                    className="flex items-center gap-1.5 px-3 py-3 rounded border text-sm"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: B.muted,
                    }}
                  >
                    <span>AU</span>
                    <span className="text-xs">+61</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={regPhone}
                    onChange={(e) => onRegPhoneChange(e.target.value)}
                    className="flex-1 px-4 py-3 rounded border text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: B.white,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = B.accent)}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label
                  className="flex items-start gap-2 cursor-pointer"
                  onClick={onToggleAgreed}
                >
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      borderColor: agreed
                        ? B.accent
                        : "rgba(255,255,255,0.25)",
                      backgroundColor: agreed
                        ? B.accent
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {agreed && (
                      <Check
                        className="w-2.5 h-2.5"
                        style={{ color: B.dark }}
                      />
                    )}
                  </div>
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: B.muted }}
                  >
                    I agree with SimplyBook.me{" "}
                    <span
                      style={{ color: B.accent }}
                      className="cursor-pointer hover:underline"
                    >
                      Terms and Conditions
                    </span>
                    <span style={{ color: B.accent }}> *</span>
                  </span>
                </label>
                <label
                  className="flex items-start gap-2 cursor-pointer"
                  onClick={onToggleSubscribe}
                >
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      borderColor: subscribe
                        ? B.accent
                        : "rgba(255,255,255,0.25)",
                      backgroundColor: subscribe
                        ? B.accent
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {subscribe && (
                      <Check
                        className="w-2.5 h-2.5"
                        style={{ color: B.dark }}
                      />
                    )}
                  </div>
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: B.muted }}
                  >
                    Subscribe to receive promotions and relevant information.
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting || !agreed}
              className="w-full py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: agreed ? B.cta : "rgba(255,255,255,0.1)",
                color: agreed ? B.white : B.muted,
                cursor: agreed ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (agreed) e.currentTarget.style.backgroundColor = B.ctaHov;
              }}
              onMouseLeave={(e) => {
                if (agreed) e.currentTarget.style.backgroundColor = B.cta;
              }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Register And Continue"
              )}
            </button>
          </div>
        </div>

        {/* Booking summary */}
        <div
          className="mt-6 p-5 rounded border"
          style={{ backgroundColor: B.card, borderColor: B.border }}
        >
          <h4
            className="text-xs font-black uppercase tracking-widest mb-4"
            style={{ color: B.accent }}
          >
            Your Booking Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Service", value: service.name },
              { label: "Provider", value: selectedProvider?.name || "Any available" },
              {
                label: "Date",
                value:
                  selectedDate?.toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }) || "-",
              },
              { label: "Time", value: selectedTime || "-" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: B.muted }}
                >
                  {label}
                </p>
                <p className="text-sm font-bold text-white truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
