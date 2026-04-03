"use client";

/**
 * Legacy AuthContext — compatibility layer.
 *
 * Derives its state from the role-based session system so that existing
 * consumers (`useAuth()`) keep working without modification.
 *
 * New code should use `useRoleAuth()` from `@/contexts/RoleAuthContext` or
 * the route-aware `useAuth()` from `@/hooks/useAuth` instead.
 */

import React, { createContext, useContext, useMemo } from "react";
import { User, UserRole } from "@/types";
import { useRoleAuth } from "./RoleAuthContext";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const ROLE_PRIORITY: UserRole[] = [
  "Super_Admin",
  "Business_owner",
  "Customer",
  "Service_Provider",
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getSession, activeRoles, isLoading, logoutAll } = useRoleAuth();

  const primaryRole = useMemo(
    () => ROLE_PRIORITY.find((r) => activeRoles.includes(r)) ?? null,
    [activeRoles],
  );

  const session = useMemo(
    () => (primaryRole ? getSession(primaryRole) : null),
    [primaryRole, getSession],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!(session?.token && session?.user),
      isLoading,
      setUser: () => {
        /* no-op: use setSession on RoleAuthContext */
      },
      setToken: () => {
        /* no-op: use setSession on RoleAuthContext */
      },
      logout: logoutAll,
    }),
    [session, isLoading, logoutAll],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
