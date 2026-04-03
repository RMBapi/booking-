"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, UserRole } from "@/types";
import {
  getRoleSession,
  saveRoleSession,
  clearRoleSession,
  clearAllRoleSessions,
  getActiveRoleSessions,
  migrateToRoleBasedStorage,
} from "@/lib/roleBasedAuth";

export interface RoleSession {
  user: User | null;
  token: string | null;
  businessSiteSlug: string | null;
}

interface RoleAuthContextType {
  getSession: (role: UserRole) => RoleSession;
  setSession: (
    role: UserRole,
    token: string,
    user: User,
    additionalData?: Record<string, string>,
  ) => void;
  logout: (role: UserRole) => void;
  logoutAll: () => void;
  isLoggedInAs: (role: UserRole) => boolean;
  activeRoles: UserRole[];
  isLoading: boolean;
}

const RoleAuthContext = createContext<RoleAuthContextType | undefined>(
  undefined,
);

export const RoleAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoles, setActiveRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    migrateToRoleBasedStorage();
    setActiveRoles(getActiveRoleSessions());
    setIsLoading(false);
  }, []);

  const getSession = useCallback((role: UserRole): RoleSession => {
    const { token, user, additionalData } = getRoleSession(role);
    return {
      token,
      user,
      businessSiteSlug: additionalData?.businessSiteSlug ?? null,
    };
  }, []);

  const setSession = useCallback(
    (
      role: UserRole,
      token: string,
      user: User,
      additionalData?: Record<string, string>,
    ) => {
      saveRoleSession(role, token, user, additionalData);
      setActiveRoles((prev) =>
        prev.includes(role) ? prev : [...prev, role],
      );
    },
    [],
  );

  const logout = useCallback((role: UserRole) => {
    clearRoleSession(role);
    setActiveRoles((prev) => prev.filter((r) => r !== role));
  }, []);

  const logoutAll = useCallback(() => {
    clearAllRoleSessions();
    setActiveRoles([]);
  }, []);

  const isLoggedInAs = useCallback((role: UserRole): boolean => {
    const { token, user } = getRoleSession(role);
    return !!(token && user);
  }, []);

  return (
    <RoleAuthContext.Provider
      value={{
        getSession,
        setSession,
        logout,
        logoutAll,
        isLoggedInAs,
        activeRoles,
        isLoading,
      }}
    >
      {children}
    </RoleAuthContext.Provider>
  );
};

export const useRoleAuth = () => {
  const context = useContext(RoleAuthContext);
  if (!context) {
    throw new Error("useRoleAuth must be used within RoleAuthProvider");
  }
  return context;
};
