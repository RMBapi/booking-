/**
 * In-memory access-token store. Never written to localStorage; refresh
 * comes from the cb_rt httpOnly cookie.
 */

let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

// ─── activeBusinessId (single, role-agnostic) ─────────────────────────────

const ACTIVE_BUSINESS_KEY = "activeBusinessId";

export function getActiveBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
}

export function setActiveBusinessId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_BUSINESS_KEY, id);
  else window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
}

// ─── has_session marker cookie (UX-only, no security value) ───────────────

export function setSessionMarker(present: boolean): void {
  if (typeof document === "undefined") return;
  if (present) {
    document.cookie = "has_session=1; path=/; SameSite=Lax";
  } else {
    document.cookie =
      "has_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}
