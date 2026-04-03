"use client";

import React from "react";
import { UserRole } from "@/types";
import { useRoleAuth } from "@/contexts/RoleAuthContext";

interface PermissionGateProps {
  /**
   * Role(s) that are allowed to see the children.
   * Pass a single role or an array.
   */
  allowedRoles: UserRole | UserRole[];
  /**
   * Optional fallback rendered when the user doesn't have the required role.
   * If omitted, nothing is rendered.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render UI based on the user's active role sessions.
 *
 * This is a **UI hint only** — the backend always enforces permissions.
 * Use this to hide/show elements (buttons, menu items, sections) that
 * are irrelevant to certain roles.
 *
 * Usage:
 * ```tsx
 * <PermissionGate allowedRoles="Super_Admin">
 *   <button>Delete User</button>
 * </PermissionGate>
 *
 * <PermissionGate allowedRoles={["Business_owner", "Super_Admin"]} fallback={<p>No access</p>}>
 *   <AdminPanel />
 * </PermissionGate>
 * ```
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  allowedRoles,
  fallback = null,
  children,
}) => {
  const { activeRoles } = useRoleAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = roles.some((role) => activeRoles.includes(role));

  return <>{hasAccess ? children : fallback}</>;
};
