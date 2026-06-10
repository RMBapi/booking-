/**
 * Central Auth Manager
 *
 * Simplified for Customer-only public site.
 */

import { UserRole } from "@/types";
import {
  getRoleSession,
  saveRoleSession,
  clearRoleSession,
  clearAllRoleSessions,
  getActiveRoleSessions,
  getRoleRedirectPath,
  isLoggedInAs,
} from "./roleBasedAuth";

export function resolveRoleFromPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/customer")) return "Customer";
  return null;
}

export function getTokenForRole(_role: UserRole): string | null {
  const { token } = getRoleSession("Customer");
  return token;
}

/**
 * Resolve which Bearer token to attach to API requests.
 */
export function resolveToken(_opts: {
  pagePath: string;
  requestUrl?: string;
  hasBusinessIdHeader?: boolean;
}): string | null {
  return getTokenForRole("Customer");
}

/**
 * Determine which role's session to clear after a 401 error.
 */
export function resolveRoleForLogout(_opts: {
  pagePath: string;
  requestUrl?: string;
  hasBusinessIdHeader?: boolean;
}): UserRole | null {
  return "Customer";
}

export function getLoginPathForRole(_role: UserRole): string {
  return "/auth/login/customer";
}

/**
 * Only force a global logout + login redirect when a 401 likely means the
 * session token is invalid. Resource mutations (POST/PATCH/DELETE) and review
 * endpoints may return 401 for permission/validation issues — those should be
 * handled by the calling UI instead of clearing the session.
 */
export function shouldForceLogoutOn401(url: string, method?: string): boolean {
  if (url.includes("/review")) return false;

  const normalizedMethod = (method ?? "get").toLowerCase();
  if (normalizedMethod !== "get" && normalizedMethod !== "head") {
    return false;
  }

  return true;
}

const PUBLIC_ENDPOINT_FRAGMENTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/contact",
  "/business/slug",
  "/scheduler/available-slots",
  "/service/public",
] as const;

export function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINT_FRAGMENTS.some((frag) => url.includes(frag));
}

export {
  getRoleSession,
  saveRoleSession,
  clearRoleSession,
  clearAllRoleSessions,
  getActiveRoleSessions,
  getRoleRedirectPath,
  isLoggedInAs,
};
