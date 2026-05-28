"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors";
import { normalizeErrorMessage } from "@/lib/errorUtils";

export default function BusinessPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Business page error:", normalizeErrorMessage(error), error);
  }, [error]);

  return (
    <ErrorFallback
      title="This page couldn't load"
      message="Something went wrong while loading the salon page. Please try again."
      onRetry={reset}
    />
  );
}
