"use client";

import { usePathname } from "next/navigation";
import { UserRole } from "@/types";
import { resolveRoleFromPath } from "@/lib/auth";

/**
 * Derives the active UserRole from the current route.
 * Returns `null` on pages that don't belong to a role-protected area
 * (e.g. landing, public business page, auth pages).
 */
export function useRole(): UserRole | null {
  const pathname = usePathname();
  return resolveRoleFromPath(pathname);
}
