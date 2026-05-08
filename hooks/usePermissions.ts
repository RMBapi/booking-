"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { FeatureCode } from "@/types";

/**
 * Single permission hook. Reads permissions[] from the active membership,
 * grants everything to Super_Admin, and exposes simple feature checks.
 */
export function usePermissions() {
  const { me, activeMembership } = useAuth();

  const isSuperAdmin = me?.user.systemRole === "Super_Admin";
  const permissions = activeMembership?.permissions ?? [];
  const hasAll = isSuperAdmin;

  return {
    systemRole: me?.user.systemRole ?? null,
    activeMembership,
    permissions,
    hasFeature: (code: FeatureCode) =>
      hasAll || permissions.includes(code),
    hasAllFeatures: (codes: FeatureCode[]) =>
      hasAll || codes.every((c) => permissions.includes(c)),
    hasAnyFeature: (codes: FeatureCode[]) =>
      hasAll || codes.some((c) => permissions.includes(c)),
    isSuperAdmin,
    isBusinessOwner: activeMembership?.role === "Business_owner",
  };
}
