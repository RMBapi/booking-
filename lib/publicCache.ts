import type { Business, Service } from "@/types";

/**
 * Lightweight client-side cache for public business + services data, keyed by
 * slug. Backed by sessionStorage so navigating between the public site and the
 * customer pages can render the shared navbar instantly (from cache) while a
 * fresh copy is revalidated in the background.
 *
 * This is intentionally best-effort: any storage/parse failure is swallowed and
 * treated as a cache miss so the UI always falls back to a network fetch.
 */

const KEY_PREFIX = "public_cache_v1:";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedSitePayload {
  business: Business | null;
  services: Service[];
  ts: number;
}

export interface CachedSite {
  business: Business | null;
  services: Service[];
}

function storageKey(slug: string) {
  return `${KEY_PREFIX}${slug}`;
}

export function readSiteCache(slug: string | null): CachedSite | null {
  if (!slug || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSitePayload;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return {
      business: parsed.business ?? null,
      services: Array.isArray(parsed.services) ? parsed.services : [],
    };
  } catch {
    return null;
  }
}

export function writeSiteCache(slug: string | null, data: CachedSite): void {
  if (!slug || typeof window === "undefined") return;
  try {
    const payload: CachedSitePayload = {
      business: data.business,
      services: data.services,
      ts: Date.now(),
    };
    window.sessionStorage.setItem(storageKey(slug), JSON.stringify(payload));
  } catch {
    // Storage full / unavailable — ignore, fetch will run again next time.
  }
}
