/**
 * Central Auth Manager
 *
 * Provides a unified API for role-based authentication:
 * - Role resolution from URL paths
 * - Token retrieval scoped to the active role
 * - Login/logout redirect paths
 *
 * All session persistence is delegated to roleBasedAuth.ts (localStorage).
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

// ─── Route → Role mapping ────────────────────────────────────────────────────

const ROUTE_ROLE_MAP: ReadonlyArray<{ prefix: string; role: UserRole }> = [
  { prefix: "/super-admin", role: "Super_Admin" },
  { prefix: "/business-owner", role: "Business_owner" },
  { prefix: "/customer", role: "Customer" },
  { prefix: "/service-provider", role: "Service_Provider" },
];

/**
 * Derive the expected UserRole from a URL pathname.
 * Returns `null` when the path doesn't belong to any role-protected area.
 */
export function resolveRoleFromPath(pathname: string): UserRole | null {
  for (const { prefix, role } of ROUTE_ROLE_MAP) {
    if (pathname.startsWith(prefix)) return role;
  }
  return null;
}

// ─── URL → Role mapping (for API endpoint heuristics) ────────────────────────

const ENDPOINT_ROLE_MAP: ReadonlyArray<{
  pattern: string;
  role: UserRole;
}> = [
  { pattern: "/admin", role: "Super_Admin" },
  { pattern: "/business", role: "Business_owner" },
  { pattern: "/service", role: "Business_owner" },
  { pattern: "/scheduler", role: "Business_owner" },
  { pattern: "/provider", role: "Service_Provider" },
  { pattern: "/service-provider", role: "Service_Provider" },
  { pattern: "/customer", role: "Customer" },
];

/**
 * Best-effort guess of the role an API endpoint belongs to.
 * Used only as a fallback when the page path gives no signal.
 */
export function guessRoleFromEndpoint(url: string): UserRole | null {
  for (const { pattern, role } of ENDPOINT_ROLE_MAP) {
    if (url.includes(pattern)) return role;
  }
  return null;
}

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getTokenForRole(role: UserRole): string | null {
  const { token } = getRoleSession(role);
  return token;
}

/**
 * Resolve which Bearer token to attach based on:
 *  1. page path (most reliable)
 *  2. request-level hints (x-business-id header → Business_owner)
 *  3. API endpoint heuristic
 *  4. first available token (last resort)
 */
export function resolveToken(opts: {
  pagePath: string;
  requestUrl?: string;
  hasBusinessIdHeader?: boolean;
}): string | null {
  const { pagePath, requestUrl, hasBusinessIdHeader } = opts;

  // 1. Business-id header is a strong signal for owner context
  if (hasBusinessIdHeader) {
    const t = getTokenForRole("Business_owner");
    if (t) return t;
  }

  // 2. Page path
  const pathRole = resolveRoleFromPath(pagePath);
  if (pathRole) {
    const t = getTokenForRole(pathRole);
    if (t) return t;
  }

  // 3. Booking/contact endpoints: disambiguate by page context
  if (requestUrl && (requestUrl.includes("/booking") || requestUrl.includes("/contact"))) {
    if (pagePath.includes("/business-owner") || hasBusinessIdHeader) {
      const t = getTokenForRole("Business_owner");
      if (t) return t;
    }
    const t = getTokenForRole("Customer");
    if (t) return t;
  }

  // 4. Endpoint heuristic
  if (requestUrl) {
    const endpointRole = guessRoleFromEndpoint(requestUrl);
    if (endpointRole) {
      const t = getTokenForRole(endpointRole);
      if (t) return t;
    }
  }

  // 5. Fallback: try all roles in priority order
  const priority: UserRole[] = [
    "Business_owner",
    "Customer",
    "Service_Provider",
    "Super_Admin",
  ];
  for (const role of priority) {
    const t = getTokenForRole(role);
    if (t) return t;
  }

  return null;
}

/**
 * Determine which role's session to clear after a 401 error.
 * Uses the same resolution logic as token selection so the right session
 * gets cleared.
 */
export function resolveRoleForLogout(opts: {
  pagePath: string;
  requestUrl?: string;
  hasBusinessIdHeader?: boolean;
}): UserRole | null {
  const { pagePath, requestUrl, hasBusinessIdHeader } = opts;

  if (hasBusinessIdHeader) return "Business_owner";

  const pathRole = resolveRoleFromPath(pagePath);
  if (pathRole) return pathRole;

  if (requestUrl) {
    if (requestUrl.includes("/booking") || requestUrl.includes("/contact")) {
      if (pagePath.includes("/business-owner") || hasBusinessIdHeader) return "Business_owner";
      return "Customer";
    }
    const endpointRole = guessRoleFromEndpoint(requestUrl);
    if (endpointRole) return endpointRole;
  }

  return null;
}

// ─── Login-path helpers ──────────────────────────────────────────────────────

const ROLE_LOGIN_PATHS: Record<UserRole, string> = {
  Customer: "/auth/login",
  Service_Provider: "/auth/login",
  Business_owner: "/auth/login",
  Super_Admin: "/auth/login/super-admin",
};

export function getLoginPathForRole(role: UserRole): string {
  return ROLE_LOGIN_PATHS[role];
}

// ─── Public endpoint check ───────────────────────────────────────────────────

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

// ─── Re-exports for convenience (single import path) ────────────────────────

export {
  getRoleSession,
  saveRoleSession,
  clearRoleSession,
  clearAllRoleSessions,
  getActiveRoleSessions,
  getRoleRedirectPath,
  isLoggedInAs,
};
