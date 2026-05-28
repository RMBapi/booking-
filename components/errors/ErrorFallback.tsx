"use client";

import React from "react";
import { ELEGANZA } from "@/lib/publicBrand";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorFallback({
  title = "Something went wrong",
  message = "This section couldn't load. The rest of the site should still work.",
  onRetry,
  compact = false,
}: ErrorFallbackProps) {
  return (
    <div
      className={`flex items-center justify-center text-center ${
        compact ? "py-10 px-6" : "min-h-[40vh] px-6"
      }`}
      style={{ backgroundColor: ELEGANZA.surfaceMuted }}
    >
      <div className="max-w-md">
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: ELEGANZA.ink }}
        >
          {title}
        </h2>
        <p className="text-sm mb-6" style={{ color: ELEGANZA.inkMuted }}>
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-2.5 rounded text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors"
            style={{ backgroundColor: ELEGANZA.cta }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ELEGANZA.cta;
            }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
