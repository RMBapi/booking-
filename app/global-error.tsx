"use client";

import { useEffect } from "react";
import { normalizeErrorMessage } from "@/lib/errorUtils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", normalizeErrorMessage(error), error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4 font-sans text-[#222222]">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-[#767676] mb-8">
            The page hit an unexpected error. You can try again or refresh.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={reset}
              className="px-6 py-3 rounded text-sm font-semibold uppercase tracking-widest text-white bg-[#817b64] hover:bg-[#6f6a55] transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded text-sm font-semibold uppercase tracking-widest border border-[#222222] text-[#222222] hover:bg-[#222222] hover:text-white transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
