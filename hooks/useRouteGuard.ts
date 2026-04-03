"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRoleAuth } from "@/contexts/RoleAuthContext";
import { UserRole } from "@/types";
import { getLoginPathForRole } from "@/lib/auth";

interface UseRouteGuardOptions {
  role?: UserRole;
  redirectTo?: string;
}

interface UseRouteGuardReturn {
  isLoading: boolean;
  isAuthorized: boolean;
  role: UserRole | null;
}

/**
 * Protects a page by verifying that a Customer session exists.
 * Redirects to the login page when the session is missing.
 */
export function useRouteGuard(
  options: UseRouteGuardOptions = {},
): UseRouteGuardReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { getSession, isLoading: authLoading } = useRoleAuth();

  const role: UserRole = options.role ?? "Customer";
  const [checked, setChecked] = useState(false);

  const session = getSession(role);
  const isAuthorized = !!(session?.token && session?.user);

  useEffect(() => {
    if (authLoading) return;

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
