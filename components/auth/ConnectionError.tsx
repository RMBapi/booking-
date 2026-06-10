"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Shown when we can't reach/verify the backend during auth bootstrap. This is
 * NOT a logged-out state — the session is preserved; the user just retries.
 */
export function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="text-base font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-1.5 text-sm text-text-tertiary leading-relaxed">
          We couldn&apos;t reach the server. Your session is still active — check
          your connection and try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
