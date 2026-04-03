"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRoleAuth } from "@/contexts/RoleAuthContext";
import { UserRole } from "@/types";
import { resolveRoleFromPath, getLoginPathForRole } from "@/lib/auth";

interface UseRouteGuardOptions {
  /**
   * Explicit role to guard for. When omitted the role is inferred
   * from the current pathname via `resolveRoleFromPath`.
   */
  role?: UserRole;
  /**
   * Where to redirect when the session is missing.
   * Defaults to the role-specific login page.
   */
  redirectTo?: string;
}

interface UseRouteGuardReturn {
  /** True while checking the session (show a loader). */
  isLoading: boolean;
  /** True when a valid session exists for the guarded role. */
  isAuthorized: boolean;
  /** The role being guarded. */
  role: UserRole | null;
}

/**
 * Protects a page by verifying that a session exists for the required role.
 *
 * Redirects to the role-specific login page (with a `returnUrl` query param)
 * when the session is missing. The redirect is only triggered once hydration
 * is complete to avoid flicker.
 *
 * Usage:
 * ```tsx
 * const { isLoading, isAuthorized } = useRouteGuard();
 * if (isLoading) return <PageLoader />;
 * if (!isAuthorized) return null;
 * ```
 */
export function useRouteGuard(
  options: UseRouteGuardOptions = {},
): UseRouteGuardReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { getSession, isLoading: authLoading } = useRoleAuth();

  const role = options.role ?? resolveRoleFromPath(pathname);

  const [checked, setChecked] = useState(false);

  const session = role ? getSession(role) : null;
  const isAuthorized = !!(session?.token && session?.user);

  useEffect(() => {
    if (authLoading) return;

    if (!role) {
      setChecked(true);
      return;
    }

    if (!isAuthorized) {
      const loginPath = options.redirectTo ?? getLoginPathForRole(role);
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`${loginPath}?returnUrl=${returnUrl}`);
    }

    setChecked(true);
  }, [authLoading, role, isAuthorized, pathname, router, options.redirectTo]);

  return {
    isLoading: authLoading || !checked,
    isAuthorized,
    role,
  };
}
