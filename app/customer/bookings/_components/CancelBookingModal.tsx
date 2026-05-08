"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Calendar, Clock, X } from "lucide-react";
import { BRAND } from "@/lib/publicBrand";

const REASON_PRESETS = [
  "Schedule conflict",
  "Booked by mistake",
  "Found another provider",
  "No longer needed",
  "Other",
] as const;

interface CancelBookingModalProps {
  isOpen: boolean;
  serviceName: string;
  providerName?: string;
  dateLabel?: string;
  timeLabel?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function CancelBookingModal({
  isOpen,
  serviceName,
  providerName,
  dateLabel,
  timeLabel,
  submitting = false,
  onClose,
  onConfirm,
}: CancelBookingModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset("");
      setCustomReason("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, submitting]);

  if (!mounted) return null;

  const isOtherSelected = selectedPreset === "Other";
  const trimmedCustom = customReason.trim();
  const finalReason = isOtherSelected ? trimmedCustom : selectedPreset;
  const canSubmit =
    !submitting &&
    !!selectedPreset &&
    (!isOtherSelected || trimmedCustom.length >= 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset) {
      setError("Please select a reason.");
      return;
    }
    if (isOtherSelected && trimmedCustom.length < 3) {
      setError("Please describe the reason (at least 3 characters).");
      return;
    }
    setError(null);
    await onConfirm(finalReason);
  };

  const handleBackdropClick = () => {
    if (submitting) return;
    onClose();
  };

  const node = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: BRAND.card,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "rgba(255,255,255,0.6)" }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-6 pt-6 pb-5" style={{ backgroundColor: BRAND.darker }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
                >
                  <AlertTriangle className="w-5 h-5" style={{ color: "#FCA5A5" }} />
                </div>
                <div className="min-w-0 pr-6">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.4em]"
                    style={{ color: "#FCA5A5" }}
                  >
                    Cancel Booking
                  </p>
                  <h2 className="mt-1.5 text-lg font-bold text-white truncate">
                    {serviceName}
                  </h2>
                  {providerName && (
                    <p
                      className="mt-0.5 text-xs truncate"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      with <span className="font-semibold">{providerName}</span>
                    </p>
                  )}
                  {(dateLabel || timeLabel) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      {dateLabel && (
                        <div
                          className="flex items-center gap-1.5 text-[11px]"
                          style={{ color: "rgba(255,255,255,0.55)" }}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{dateLabel}</span>
                        </div>
                      )}
                      {timeLabel && (
                        <div
                          className="flex items-center gap-1.5 text-[11px]"
                          style={{ color: "rgba(255,255,255,0.55)" }}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{timeLabel}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              <p
                className="text-sm mb-5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                This will cancel your booking. Please tell us why so we can improve the experience.
              </p>

              <label
                className="block text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Reason <span style={{ color: BRAND.accent }}>*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                {REASON_PRESETS.map((preset) => {
                  const active = selectedPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset);
                        setError(null);
                      }}
                      disabled={submitting}
                      className="px-4 py-3 rounded-lg text-xs font-semibold text-left transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: active
                          ? "rgba(201, 150, 109, 0.16)"
                          : "rgba(255,255,255,0.04)",
                        borderColor: active ? BRAND.accent : "rgba(255,255,255,0.1)",
                        color: active ? BRAND.accent : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {isOtherSelected && (
                <div className="mb-5">
                  <label
                    htmlFor="cancel-reason-other"
                    className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    Please describe
                  </label>
                  <textarea
                    id="cancel-reason-other"
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setError(null);
                    }}
                    maxLength={500}
                    rows={3}
                    placeholder="Tell us what happened..."
                    disabled={submitting}
                    autoFocus
                    className="w-full rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <p
                    className="mt-1.5 text-[10px] text-right"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {customReason.length}/500
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="mb-5 rounded-lg px-4 py-3 text-xs"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#FCA5A5",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest border transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "white",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting)
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-5 py-2.5 rounded text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#DC2626" }}
                  onMouseEnter={(e) => {
                    if (canSubmit) e.currentTarget.style.backgroundColor = "#B91C1C";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#DC2626";
                  }}
                >
                  {submitting ? (
                    <>
                      <div
                        className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: "rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                        }}
                      />
                      Cancelling...
                    </>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return createPortal(node, document.body);
}
