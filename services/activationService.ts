import type { ActivationView, AuthResponse } from "@/types";

const baseURL =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Activation endpoints are public (no Authorization header). We bypass
 * the http client so a stale Bearer in memory doesn't bias the response.
 */
export const getActivation = async (
  token: string,
): Promise<ActivationView> => {
  const res = await fetch(
    `${baseURL}/activation/${encodeURIComponent(token)}`,
    { credentials: "include" },
  );
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new Error(`Activation lookup failed (${res.status})`);
  }
  const json = await res.json();
  return json?.data ?? json;
};

export const acceptActivation = async (
  token: string,
  password: string,
): Promise<AuthResponse> => {
  const res = await fetch(
    `${baseURL}/activation/${encodeURIComponent(token)}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Activation failed (${res.status})`);
  }
  const json = await res.json();
  return json?.data ?? json;
};
