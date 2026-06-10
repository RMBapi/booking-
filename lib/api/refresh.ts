/**
 * /auth/refresh helper.
 *
 * Single in-flight refresh — concurrent 401s share one network call. The
 * cb_rt cookie travels via credentials:'include'; on success we cache the
 * fresh access token in memory.
 *
 * Failure modes are NOT equal. A 401/403 from /auth/refresh means the refresh
 * cookie is gone or invalid → the session is genuinely over (safe to log out).
 * A network error or 5xx means the backend is unreachable/broken → the session
 * may still be valid, so we must NOT discard the token or log the user out.
 * Callers branch on `RefreshError.isAuthError` (or `isTransientError`).
 */

import { setAccessToken } from "./accessToken";

const baseURL = (() => {
  if (typeof window !== "undefined") return "/api";
  return process.env.NEXT_PUBLIC_API_URL;
})();

export class RefreshError extends Error {
  readonly status?: number;
  /** True only when the session is genuinely invalid → safe to force logout. */
  readonly isAuthError: boolean;

  constructor(
    message: string,
    opts: { status?: number; isAuthError: boolean },
  ) {
    super(message);
    this.name = "RefreshError";
    this.status = opts.status;
    this.isAuthError = opts.isAuthError;
  }
}

/**
 * Should this error be treated as "backend down / try again" rather than
 * "logged out"? Handles both RefreshError and axios-style errors (e.g. a failed
 * /auth/me): no response = network/CORS/backend down; 5xx = server broken.
 */
export function isTransientError(err: unknown): boolean {
  if (err instanceof RefreshError) return !err.isAuthError;
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === undefined) return true; // network failure, backend unreachable
  return status >= 500;
}

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccess(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    let res: Response;
    try {
      res = await fetch(`${baseURL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } catch {
      // Couldn't even reach the backend — transient. Keep the token.
      throw new RefreshError("refresh_network_error", { isAuthError: false });
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // Refresh cookie missing/expired → session is really over.
        setAccessToken(null);
        throw new RefreshError("refresh_unauthorized", {
          status: res.status,
          isAuthError: true,
        });
      }
      // 5xx / unexpected — server problem, not an auth failure. Keep the token.
      throw new RefreshError("refresh_failed", {
        status: res.status,
        isAuthError: false,
      });
    }

    const json = await res.json().catch(() => null);
    const token: string | undefined =
      json?.data?.accessToken ?? json?.accessToken;
    if (!token) {
      // Malformed success — don't nuke the session over a server glitch.
      throw new RefreshError("refresh_no_token", {
        status: res.status,
        isAuthError: false,
      });
    }
    setAccessToken(token);
    return token;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
