"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { BRAND } from "@/lib/publicBrand";

export interface ReviewSubmitPayload {
  rating: number;
  comment?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  serviceName: string;
  providerName?: string;
  initialRating?: number;
  initialComment?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewSubmitPayload) => void | Promise<void>;
}

export function ReviewModal({
  isOpen,
  mode,
  serviceName,
  providerName,
  initialRating = 0,
  initialComment = "",
  submitting = false,
  onClose,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
      setHoverRating(0);
    }
  }, [isOpen, initialRating, initialComment]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const ratingLabel = useMemo(() => {
    const active = hoverRating || rating;
    return (
      ["", "Poor", "Fair", "Good", "Great", "Excellent"][active] ?? ""
    );
  }, [rating, hoverRating]);

  if (!mounted) return null;

  const canSubmit = rating >= 1 && rating <= 5 && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      rating,
      comment: comment.trim() ? comment.trim() : undefined,
    });
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
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: BRAND.card, border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10"
              style={{ color: "rgba(255,255,255,0.6)" }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-6 pt-6 pb-4" style={{ backgroundColor: BRAND.darker }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.4em]"
                style={{ color: BRAND.accent }}
              >
                {mode === "edit" ? "Update Review" : "Leave a Review"}
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                {serviceName}
              </h2>
              {providerName && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  with <span className="font-semibold">{providerName}</span>
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="mb-6">
                <label
                  className="block text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((v) => {
                    const active = (hoverRating || rating) >= v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRating(v)}
                        onMouseEnter={() => setHoverRating(v)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`${v} star${v > 1 ? "s" : ""}`}
                      >
                        <Star
                          className="w-8 h-8 transition-colors"
                          style={{
                            color: active ? "#F59E0B" : "rgba(255,255,255,0.2)",
                            fill: active ? "#F59E0B" : "transparent",
                          }}
                        />
                      </button>
                    );
                  })}
                  <span
                    className="ml-3 text-xs font-bold uppercase tracking-widest min-w-[70px]"
                    style={{ color: BRAND.accent }}
                  >
                    {ratingLabel}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="review-comment"
                  className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Comment <span className="normal-case tracking-normal opacity-70">(optional)</span>
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Share your experience..."
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2"
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
                  {comment.length}/2000
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest border transition-all disabled:opacity-60"
                  style={{
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "white",
                    backgroundColor: "transparent",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-5 py-2.5 rounded text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: BRAND.cta }}
                  onMouseEnter={(e) => {
                    if (canSubmit) e.currentTarget.style.backgroundColor = BRAND.ctaHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BRAND.cta;
                  }}
                >
                  {submitting
                    ? mode === "edit"
                      ? "Updating..."
                      : "Submitting..."
                    : mode === "edit"
                      ? "Update Review"
                      : "Submit Review"}
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
