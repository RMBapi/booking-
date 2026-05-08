"use client";

import React, { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  User,
  Mail,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { B, STEP_TRANSITION } from "../constants";
import type { Provider, ServiceInfo } from "../types";

type ClientPhase = "choose" | "guest" | "login";

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

const inputStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.05)",
  borderColor: "rgba(255,255,255,0.15)",
  color: "#FFFFFF",
};

const onInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = B.accent;
  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
};

const onInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
};

const phaseTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: "easeInOut" as const },
};

/* ── Booking Summary Card ── */
function BookingSummaryCard({
  service,
  selectedProvider,
  selectedDate,
  selectedTime,
}: {
  service: ServiceInfo;
  selectedProvider: Provider | null;
  selectedDate: Date | null;
  selectedTime: string | null;
}) {
  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        backgroundColor: B.card,
        border: `1px solid ${B.border}`,
      }}
    >
      <h4
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: B.muted }}
      >
        Booking Summary
      </h4>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            <Calendar className="w-4 h-4" style={{ color: B.accent }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: B.white }}>
              {service.name}
            </p>
            {selectedProvider && (
              <p className="text-[11px] mt-0.5" style={{ color: B.muted }}>
                with {selectedProvider.name}
              </p>
            )}
          </div>
        </div>

        {dateStr && (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <Clock className="w-4 h-4" style={{ color: B.accent }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: B.white }}>
                {dateStr}
              </p>
              {selectedTime && (
                <p className="text-[11px] mt-0.5" style={{ color: B.muted }}>
                  at {selectedTime}
                </p>
              )}
            </div>
          </div>
        )}

        <div
          className="h-px"
          style={{ backgroundColor: B.border }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <DollarSign className="w-4 h-4" style={{ color: B.accent }} />
            </div>
            <div>
              <p className="text-[11px]" style={{ color: B.muted }}>
                {service.duration}
              </p>
            </div>
          </div>
          <p className="text-sm font-black" style={{ color: B.accent }}>
            {service.price}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Google SVG icon ── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ── Facebook SVG icon ── */
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export const ClientStep = React.memo(function ClientStep({
  service,
  selectedProvider,
  selectedDate,
  selectedTime,
  isAuthenticated,
  businessName,
  showPass,
  loginEmail,
  loginPassword,
  regName,
  regEmail,
  regPhone,
  regNotes,
  agreed,
  submitting,
  submitError,
  onToggleShowPass,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegNameChange,
  onRegEmailChange,
  onRegPhoneChange,
  onRegNotesChange,
  onToggleAgreed,
  onSubmit,
}: ClientStepProps) {
  const [clientPhase, setClientPhase] = useState<ClientPhase>("choose");

  const guestFormValid = !!(agreed && regName.trim() && regEmail.trim());
  const loginFormValid = !!(loginEmail.trim() && loginPassword.trim());

  /* ── Authenticated shortcut ── */
  if (isAuthenticated) {
    return (
      <motion.div {...STEP_TRANSITION}>
        <h2
          className="font-black uppercase text-white mb-2 tracking-widest"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}
        >
          CONFIRM YOUR BOOKING
        </h2>
        <p className="text-sm mb-10" style={{ color: B.muted }}>
          You are signed in and ready to book
          {businessName ? ` with ${businessName}` : ""}.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div
              className="rounded-xl border p-6 space-y-4"
              style={{ backgroundColor: B.card, borderColor: B.border }}
            >
              {submitError && (
                <div className="text-xs" style={{ color: "#FCA5A5" }}>
                  {submitError}
                </div>
              )}
              <button
                onClick={() => onSubmit("logged-in")}
                disabled={submitting}
                className="w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: B.cta, color: B.white }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = B.ctaHov)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = B.cta)}
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
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-8">
              <BookingSummaryCard
                service={service}
                selectedProvider={selectedProvider}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Guest / Login flow ── */
  return (
    <motion.div {...STEP_TRANSITION}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2
          className="font-black uppercase mb-2 tracking-widest"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", color: B.white }}
        >
          CONTINUE TO BOOKING
        </h2>
        <p className="text-sm mb-8" style={{ color: B.muted }}>
          {clientPhase === "choose"
            ? "Almost there — choose how you'd like to continue."
            : clientPhase === "guest"
              ? "Step 2 of 2 — Enter your details to confirm."
              : "Step 2 of 2 — Sign in to your account."}
        </p>

        {submitError && (
          <div
            className="mb-4 text-xs rounded-lg px-4 py-3"
            style={{ color: "#FCA5A5", backgroundColor: "rgba(252,165,165,0.1)", border: "1px solid rgba(252,165,165,0.2)" }}
          >
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Main content area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* ── PHASE: CHOOSE ── */}
              {clientPhase === "choose" && (
                <motion.div
                  key="choose"
                  {...phaseTransition}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                      style={{ backgroundColor: "rgba(201,150,109,0.12)", color: B.accent }}
                    >
                      Step 1 of 2
                    </span>
                    <span className="text-[11px]" style={{ color: B.muted }}>
                      Choose how to continue
                    </span>
                  </div>

                  {/* Primary CTA: Continue as Guest */}
                  <button
                    onClick={() => setClientPhase("guest")}
                    className="w-full rounded-xl text-left transition-all group"
                    style={{
                      backgroundColor: B.card,
                      border: `1px solid ${B.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = B.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = B.border;
                    }}
                  >
                    <div className="p-6 pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: B.accent }}
                          >
                            <User className="w-5 h-5" style={{ color: B.dark }} />
                          </div>
                          <div>
                            <h3
                              className="font-black uppercase tracking-wider text-sm mb-1"
                              style={{ color: B.white }}
                            >
                              Continue as Guest
                            </h3>
                            <p className="text-xs" style={{ color: B.muted }}>
                              No account needed — just your name and contact info
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className="w-5 h-5 flex-shrink-0 hidden sm:block"
                          style={{ color: B.muted }}
                        />
                      </div>
                    </div>
                    <div
                      className="px-6 pb-6 pt-4"
                      style={{ borderTop: `1px solid ${B.border}` }}
                    >
                      <div
                        className="w-full py-3.5 rounded-lg font-black text-sm uppercase tracking-widest text-center"
                        style={{ backgroundColor: B.cta, color: B.dark }}
                      >
                        Continue as Guest
                      </div>
                      <p
                        className="text-[11px] text-center mt-3"
                        style={{ color: B.muted }}
                      >
                        Takes less than 30 seconds
                      </p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(to right, transparent, ${B.border}, transparent)`,
                      }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: B.muted }}
                    >
                      or
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(to right, transparent, ${B.border}, transparent)`,
                      }}
                    />
                  </div>

                  {/* Secondary CTA: Sign In */}
                  <button
                    onClick={() => setClientPhase("login")}
                    className="w-full rounded-xl text-left transition-all flex items-center justify-between p-5"
                    style={{
                      backgroundColor: B.card,
                      border: `1px solid ${B.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = B.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = B.border;
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          border: `1.5px solid rgba(255,255,255,0.15)`,
                          backgroundColor: "rgba(201,150,109,0.06)",
                        }}
                      >
                        <Mail className="w-5 h-5" style={{ color: B.accent }} />
                      </div>
                      <div>
                        <h3
                          className="font-black uppercase tracking-wider text-sm mb-1"
                          style={{ color: B.white }}
                        >
                          Sign In
                        </h3>
                        <p className="text-xs" style={{ color: B.muted }}>
                          Already have an account? Sign in for a faster experience
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-5 h-5 flex-shrink-0 hidden sm:block"
                      style={{ color: B.muted }}
                    />
                  </button>

                  {/* Social login */}
                  <div className="flex items-center gap-4 mt-2">
                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(to right, transparent, ${B.border}, transparent)`,
                      }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: B.muted }}
                    >
                      Quick sign in
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(to right, transparent, ${B.border}, transparent)`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      className="flex items-center gap-2.5 px-5 py-3 rounded-lg transition-all"
                      style={{
                        border: `1px solid ${B.border}`,
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(201,150,109,0.08)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = B.border;
                      }}
                    >
                      <GoogleIcon />
                      <span className="text-xs font-bold" style={{ color: B.white }}>
                        Google
                      </span>
                    </button>
                    <button
                      className="flex items-center gap-2.5 px-5 py-3 rounded-lg transition-all"
                      style={{
                        border: `1px solid ${B.border}`,
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(201,150,109,0.08)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = B.border;
                      }}
                    >
                      <FacebookIcon />
                      <span className="text-xs font-bold" style={{ color: B.white }}>
                        Facebook
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── PHASE: GUEST FORM ── */}
              {clientPhase === "guest" && (
                <motion.div
                  key="guest"
                  {...phaseTransition}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setClientPhase("choose")}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
                      style={{ color: B.muted }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = B.white)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = B.muted)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                      style={{ backgroundColor: "rgba(201,150,109,0.12)", color: B.accent }}
                    >
                      Step 2 of 2
                    </span>
                  </div>

                  <div
                    className="rounded-xl p-6 lg:p-8 space-y-6"
                    style={{
                      backgroundColor: B.card,
                      border: `1px solid ${B.border}`,
                    }}
                  >
                    <div>
                      <h3
                        className="font-black uppercase tracking-wider text-sm mb-1"
                        style={{ color: B.white }}
                      >
                        Guest Details
                      </h3>
                      <p className="text-xs" style={{ color: B.muted }}>
                        We just need a few details to confirm your booking.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-2"
                          style={{ color: B.muted }}
                        >
                          Full Name <span style={{ color: B.accent }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Smith"
                          value={regName}
                          onChange={(e) => onRegNameChange(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-lg border text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                        />
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-2"
                          style={{ color: B.muted }}
                        >
                          Email <span style={{ color: B.accent }}>*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={regEmail}
                          onChange={(e) => onRegEmailChange(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-lg border text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                        />
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-2"
                          style={{ color: B.muted }}
                        >
                          Phone
                        </label>
                        <div className="flex gap-2">
                          <div
                            className="flex items-center gap-1.5 px-3 py-3.5 rounded-lg border text-sm flex-shrink-0"
                            style={{ ...inputStyle, color: B.muted }}
                          >
                            <span>AU</span>
                            <span className="text-xs">+61</span>
                          </div>
                          <input
                            type="tel"
                            placeholder="Phone number"
                            value={regPhone}
                            onChange={(e) => onRegPhoneChange(e.target.value)}
                            className="flex-1 px-4 py-3.5 rounded-lg border text-sm outline-none transition-all"
                            style={inputStyle}
                            onFocus={onInputFocus}
                            onBlur={onInputBlur}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-2"
                          style={{ color: B.muted }}
                        >
                          Notes{" "}
                          <span className="font-normal normal-case tracking-normal">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          placeholder="Any special requests?"
                          value={regNotes}
                          onChange={(e) => onRegNotesChange(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3.5 rounded-lg border text-sm outline-none transition-all resize-none"
                          style={inputStyle as React.CSSProperties}
                          onFocus={onInputFocus as React.FocusEventHandler<HTMLTextAreaElement>}
                          onBlur={onInputBlur as React.FocusEventHandler<HTMLTextAreaElement>}
                        />
                      </div>
                    </div>

                    <label
                      className="flex items-start gap-2.5 cursor-pointer pt-1"
                      onClick={onToggleAgreed}
                    >
                      <div
                        className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                        style={{
                          borderColor: agreed ? B.accent : "rgba(255,255,255,0.2)",
                          backgroundColor: agreed ? B.accent : "rgba(255,255,255,0.05)",
                        }}
                      >
                        {agreed && (
                          <Check className="w-3 h-3" style={{ color: B.dark }} />
                        )}
                      </div>
                      <span
                        className="text-xs leading-relaxed"
                        style={{ color: B.muted }}
                      >
                        I agree with the{" "}
                        <span
                          style={{ color: B.accent }}
                          className="cursor-pointer hover:underline"
                        >
                          Terms & Conditions
                        </span>
                      </span>
                    </label>

                    <button
                      onClick={() => onSubmit("guest")}
                      disabled={submitting || !guestFormValid}
                      className="w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: guestFormValid ? B.cta : "rgba(255,255,255,0.1)",
                        color: guestFormValid ? B.dark : B.muted,
                        cursor: guestFormValid ? "pointer" : "not-allowed",
                      }}
                      onMouseEnter={(e) => {
                        if (guestFormValid) e.currentTarget.style.backgroundColor = B.ctaHov;
                      }}
                      onMouseLeave={(e) => {
                        if (guestFormValid) e.currentTarget.style.backgroundColor = B.cta;
                      }}
                    >
                      {submitting ? (
                        <>
                          <div
                            className="w-4 h-4 border-2 rounded-full animate-spin"
                            style={{
                              borderColor: "rgba(44,8,0,0.3)",
                              borderTopColor: B.dark,
                            }}
                          />
                          Processing...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>

                    <p
                      className="text-[11px] text-center"
                      style={{ color: B.muted }}
                    >
                      Your information is secure and will only be used for this
                      booking.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── PHASE: LOGIN FORM ── */}
              {clientPhase === "login" && (
                <motion.div
                  key="login"
                  {...phaseTransition}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setClientPhase("choose")}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors"
                      style={{ color: B.muted }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = B.white)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = B.muted)}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                      style={{ backgroundColor: "rgba(201,150,109,0.12)", color: B.accent }}
                    >
                      Step 2 of 2
                    </span>
                  </div>

                  <div
                    className="rounded-xl p-6 lg:p-8 space-y-6"
                    style={{
                      backgroundColor: B.card,
                      border: `1px solid ${B.border}`,
                    }}
                  >
                    <div>
                      <h3
                        className="font-black uppercase tracking-wider text-sm mb-1"
                        style={{ color: B.white }}
                      >
                        Sign In
                      </h3>
                      <p className="text-xs" style={{ color: B.muted }}>
                        Welcome back — sign in to complete your booking.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-2"
                          style={{ color: B.muted }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={(e) => onLoginEmailChange(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-lg border text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                        />
                      </div>
                      <div>
                        <label
                          className="text-[10px] font-bold uppercase tracking-widest block mb-2"
                          style={{ color: B.muted }}
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPass ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => onLoginPasswordChange(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-lg border text-sm outline-none pr-12 transition-all"
                            style={inputStyle}
                            onFocus={onInputFocus}
                            onBlur={onInputBlur}
                          />
                          <button
                            type="button"
                            onClick={onToggleShowPass}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                            style={{ color: B.muted }}
                          >
                            {showPass ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <button
                            className="text-xs transition-colors hover:underline"
                            style={{ color: B.accent }}
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSubmit("login")}
                      disabled={submitting || !loginFormValid}
                      className="w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: loginFormValid ? B.cta : "rgba(255,255,255,0.1)",
                        color: loginFormValid ? B.dark : B.muted,
                        cursor: loginFormValid ? "pointer" : "not-allowed",
                      }}
                      onMouseEnter={(e) => {
                        if (loginFormValid) e.currentTarget.style.backgroundColor = B.ctaHov;
                      }}
                      onMouseLeave={(e) => {
                        if (loginFormValid) e.currentTarget.style.backgroundColor = B.cta;
                      }}
                    >
                      {submitting ? (
                        <>
                          <div
                            className="w-4 h-4 border-2 rounded-full animate-spin"
                            style={{
                              borderColor: "rgba(44,8,0,0.3)",
                              borderTopColor: B.dark,
                            }}
                          />
                          Processing...
                        </>
                      ) : (
                        "Sign In and Continue"
                      )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                      <div
                        className="flex-1 h-px"
                        style={{
                          background: `linear-gradient(to right, transparent, ${B.border}, transparent)`,
                        }}
                      />
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: B.muted }}
                      >
                        or
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{
                          background: `linear-gradient(to right, transparent, ${B.border}, transparent)`,
                        }}
                      />
                    </div>

                    <button
                      onClick={() => setClientPhase("guest")}
                      className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
                      style={{
                        border: `1px solid rgba(255,255,255,0.15)`,
                        color: B.accent,
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = B.accent;
                        e.currentTarget.style.backgroundColor = "rgba(201,150,109,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Continue as Guest Instead
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Booking summary sidebar */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-8">
              <BookingSummaryCard
                service={service}
                selectedProvider={selectedProvider}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
