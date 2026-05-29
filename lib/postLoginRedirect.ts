import type { MeResponse } from "@/types";

/**
 * Single source of truth for "where should this user land after login,
 * register, or activation?" Used by login/register/activation success
 * handlers and the /app landing redirect.
 */
export function postLoginPath(me: MeResponse): string {
  if (me.user.systemRole === "Super_Admin") return "/super-admin";
  if (me.user.systemRole === "Customer") {
    const slug = me.businesses[0]?.slug;
    return slug ? `/${slug}/dashboard` : "/login";
  }
  // Business_owner or Service_Provider
  const firstBusinessId = me.businesses[0]?.id;
  return firstBusinessId ? `/app/${firstBusinessId}` : "/app";
}
