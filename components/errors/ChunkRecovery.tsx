"use client";

import { useEffect } from "react";
import { isStaleChunkError, normalizeErrorMessage } from "@/lib/errorUtils";

const RELOAD_KEY = "chunk_recovery_reloaded";

function isStaticAssetError(event: ErrorEvent): boolean {
  const target = event.target;
  return (
    target instanceof HTMLImageElement ||
    target instanceof HTMLVideoElement ||
    target instanceof HTMLLinkElement ||
    target instanceof HTMLAudioElement
  );
}

function tryRecoverFromStaleChunk(reason: unknown) {
  if (!isStaleChunkError(reason)) return false;

  const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
  if (!alreadyReloaded) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
    return true;
  }

  console.warn(
    "[ChunkRecovery] Stale bundle detected after reload:",
    normalizeErrorMessage(reason),
  );
  return true;
}

/**
 * Recovers from stale Next.js/webpack chunks (common in dev after hot reload).
 * Ignores static asset failures (GIF, images, fonts) so they never trigger reload/logout.
 */
export function ChunkRecovery() {
  useEffect(() => {
    const clearReloadFlag = () => {
      window.setTimeout(() => {
        sessionStorage.removeItem(RELOAD_KEY);
      }, 4000);
    };

    if (document.readyState === "complete") {
      clearReloadFlag();
    } else {
      window.addEventListener("load", clearReloadFlag);
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof Event) return;
      if (tryRecoverFromStaleChunk(event.reason)) {
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isStaticAssetError(event)) return;

      const payload = event.error ?? event.message;
      if (tryRecoverFromStaleChunk(payload)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError, true);

    return () => {
      window.removeEventListener("load", clearReloadFlag);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError, true);
    };
  }, []);

  return null;
}
