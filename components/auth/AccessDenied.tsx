"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";

interface AccessDeniedProps {
  /** Custom message to display. */
  message?: string;
  /** Override the back button label. */
  backLabel?: string;
  /** Where the back button navigates to. Defaults to `router.back()`. */
  backHref?: string;
}

/**
 * Full-page 403 "Access Denied" component.
 *
 * Render this when the user is authenticated but lacks the permissions
 * required for the current page (e.g. after a 403 response).
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "You do not have permission to view this page.",
  backLabel = "Go Back",
  backHref,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <ShieldOff className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-stone-900">
        Access Denied
      </h1>
      <p className="mb-8 max-w-md text-stone-500">{message}</p>
      <button
        onClick={handleBack}
        className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
      >
        {backLabel}
      </button>
    </div>
  );
};
