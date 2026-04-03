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

const PUBLIC_ENDPOINT_FRAGMENTS = [
  "/auth/login",
  "/auth/register",
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
