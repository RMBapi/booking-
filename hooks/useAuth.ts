"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth, RoleSession } from "@/contexts/RoleAuthContext";
import { UserRole } from "@/types";
import { useRole } from "./useRole";
import { getLoginPathForRole } from "@/lib/auth";

interface UseAuthReturn extends RoleSession {
  /** The role determined from the current route (null on public pages). */
  role: UserRole | null;
  /** Whether the current route has an active, authenticated session. */
  isAuthenticated: boolean;
  /** All roles that currently have a stored session. */
  activeRoles: UserRole[];
  /** True while the initial session hydration is running. */
  isLoading: boolean;
  /** Log out the given role (defaults to current route role). */
  logout: (role?: UserRole) => void;
  /** Log out every role session at once. */
  logoutAll: () => void;
  /** Get the session for an arbitrary role. */
  getSession: (role: UserRole) => RoleSession;
  /** Check if a specific role has an active session. */
  isLoggedInAs: (role: UserRole) => boolean;
}

/**
 * Route-aware auth hook.
 *
 * Automatically resolves which role session to use based on the current
 * pathname. Provides login, logout, and session introspection helpers.
 *
 * Usage:
 * ```tsx
 * const { user, token, role, isAuthenticated, logout } = useAuth();
 * ```
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const role = useRole();
  const {
    getSession,
    logout: contextLogout,
    logoutAll: contextLogoutAll,
    isLoggedInAs,
    activeRoles,
    isLoading,
  } = useRoleAuth();

  const session: RoleSession = role
    ? getSession(role)
    : { user: null, token: null, businessSiteSlug: null, businessId: null };

  const logout = useCallback(
    (overrideRole?: UserRole) => {
      const target = overrideRole ?? role;
      if (!target) return;

      contextLogout(target);
      router.replace(getLoginPathForRole(target));
    },
    [role, contextLogout, router],
  );

  const logoutAll = useCallback(() => {
    contextLogoutAll();
    router.replace("/auth/login");
  }, [contextLogoutAll, router]);

  return {
    ...session,
    role,
    isAuthenticated: !!(session.token && session.user),
    activeRoles,
    isLoading,
    logout,
    logoutAll,
    getSession,
    isLoggedInAs,
  };
}
