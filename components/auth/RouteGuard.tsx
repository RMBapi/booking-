"use client";

import React from "react";
import { UserRole } from "@/types";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { PageLoader } from "@/components/ui/Loading";

interface RouteGuardProps {
  /**
   * Explicit role to require. When omitted the role is inferred from
   * the pathname (e.g. `/business-owner/*` → Business_owner).
   */
  role?: UserRole;
  /** Custom redirect path when unauthenticated (defaults to role login page). */
  redirectTo?: string;
  /** Custom loading UI (defaults to `<PageLoader />`). */
  loader?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wraps a page or layout to enforce role-based authentication.
 *
 * While checking the session it renders a loader. If the session is
 * missing the user is redirected to the role-specific login page.
 * Only renders children when authorized.
 *
 * Usage (in a layout):
 * ```tsx
 * export default function AdminLayout({ children }) {
 *   return <RouteGuard role="Super_Admin">{children}</RouteGuard>;
 * }
 * ```
 *
 * Usage (auto-detect role from route):
 * ```tsx
 * export default function ProtectedPage() {
 *   return (
 *     <RouteGuard>
 *       <DashboardContent />
 *     </RouteGuard>
 *   );
 * }
 * ```
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  role,
  redirectTo,
  loader,
  children,
}) => {
  const { isLoading, isAuthorized } = useRouteGuard({ role, redirectTo });

  if (isLoading) return <>{loader ?? <PageLoader />}</>;
  if (!isAuthorized) return null;

  return <>{children}</>;
};
