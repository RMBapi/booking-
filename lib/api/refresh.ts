/**
 * /auth/refresh helper.
 *
 * Single in-flight refresh — concurrent 401s share one network call. The
 * cb_rt cookie travels via credentials:'include'; on success we cache the
 * fresh access token in memory.
 */

import { setAccessToken } from "./accessToken";

const baseURL = (() => {
  if (typeof window !== "undefined") return "/api";
  return process.env.NEXT_PUBLIC_API_URL;
})();

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccess(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch(`${baseURL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) {
      setAccessToken(null);
      throw new Error("refresh_failed");
    }
    const json = await res.json();
    const token: string | undefined =
      json?.data?.accessToken ?? json?.accessToken;
    if (!token) {
      setAccessToken(null);
      throw new Error("refresh_no_token");
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
