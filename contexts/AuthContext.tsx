"use client";

/**
 * Legacy AuthContext — thin wrapper over RoleAuthContext.
 *
 * Kept for backward compatibility with `useAuth()` consumers.
 * New code should use `useRoleAuth()` directly.
 */

import React, { createContext, useContext, useMemo } from "react";
import { User } from "@/types";
import { useRoleAuth } from "./RoleAuthContext";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getSession, isLoading, logoutAll } = useRoleAuth();

  const session = useMemo(() => getSession("Customer"), [getSession]);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!(session?.token && session?.user),
      isLoading,
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
