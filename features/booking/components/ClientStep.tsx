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
  isAuthenticated: boolean;
  businessName?: string;
  isLogin: boolean;
  showPass: boolean;
  loginEmail: string;
  loginPassword: string;
  regName: string;
  regEmail: string;
  regPhone: string;
  regNotes: string;
  agreed: boolean;
  subscribe: boolean;
  submitting: boolean;
  submitError: string | null;
  onToggleLogin: (v: boolean) => void;
  onToggleShowPass: () => void;
  onLoginEmailChange: (v: string) => void;
  onLoginPasswordChange: (v: string) => void;
  onRegNameChange: (v: string) => void;
  onRegEmailChange: (v: string) => void;
  onRegPhoneChange: (v: string) => void;
  onRegNotesChange: (v: string) => void;
  onToggleAgreed: () => void;
  onToggleSubscribe: () => void;
  onSubmit: (mode: "login" | "guest" | "logged-in") => void;
}

export const ClientStep = React.memo(function ClientStep({
  service,
  selectedProvider,
  selectedDate,
  selectedTime,
  isAuthenticated,
  businessName,
  isLogin,
  showPass,
  loginEmail,
  loginPassword,
  regName,
  regEmail,
  regPhone,
  regNotes,
  agreed,
  subscribe,
  submitting,
  submitError,
  onToggleLogin,
  onToggleShowPass,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegNameChange,
  onRegEmailChange,
  onRegPhoneChange,
  onRegNotesChange,
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
        {isAuthenticated ? "CONFIRM YOUR BOOKING" : "CONTINUE TO BOOK"}
      </h2>
      <p className="text-sm mb-10" style={{ color: B.muted }}>
        {service.name}
        {selectedProvider ? ` - ${selectedProvider.name}` : ""}
        {dateStr ? ` - ${dateStr}` : ""}
        {selectedTime ? ` at ${selectedTime}` : ""}
      </p>

      {isAuthenticated ? (
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded border p-6 space-y-4"
            style={{ backgroundColor: B.card, borderColor: B.border }}
          >
            <p className="text-sm" style={{ color: B.muted }}>
              You are signed in and ready to book
              {businessName ? ` with ${businessName}` : ""}.
            </p>
            {submitError && (
              <div className="text-xs" style={{ color: "#FCA5A5" }}>
                {submitError}
              </div>
            )}
            <button
              onClick={() => onSubmit("logged-in")}
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
                "Confirm Booking"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {submitError && (
            <div className="mb-4 text-xs" style={{ color: "#FCA5A5" }}>
              {submitError}
            </div>
          )}

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

          <div className="flex items-center gap-4 mb-6">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: B.border }}
            />
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
                Book as Guest
              </button>
            </div>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: B.border }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded border p-6 space-y-5"
              style={{ backgroundColor: B.card, borderColor: B.border }}
            >
              <h3
                className="font-bold text-sm uppercase tracking-widest"
                style={{ color: B.accent }}
              >
                Existing Clients
              </h3>
              <p className="text-xs" style={{ color: B.muted }}>
                Please sign in here
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
                </div>
              </div>

              <button
                onClick={() => onSubmit("login")}
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

            <div
              className="rounded border p-6 space-y-5"
              style={{ backgroundColor: B.card, borderColor: B.border }}
            >
              <h3
                className="font-bold text-sm uppercase tracking-widest"
                style={{ color: B.accent }}
              >
                Guest Details
              </h3>
              <p className="text-xs" style={{ color: B.muted }}>
                We will use this to confirm your request
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

                <div>
                  <label
                    className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
                    style={{ color: B.muted }}
                  >
                    Notes:
                  </label>
                  <textarea
                    placeholder="Optional notes for the business"
                    value={regNotes}
                    onChange={(e) => onRegNotesChange(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded border text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: B.white,
                      resize: "vertical",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = B.accent)}
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.2)")
                    }
                  />
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
                      I agree to the terms and conditions
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
                      Subscribe for offers and updates.
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => onSubmit("guest")}
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
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
