"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors";
import { normalizeErrorMessage } from "@/lib/errorUtils";

export default function ContactsPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Contacts page error:", normalizeErrorMessage(error), error);
  }, [error]);

  return (
    <ErrorFallback
      title="Couldn't load your messages"
      message="Something went wrong. Please try again."
      onRetry={reset}
    />
  );
}
