"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserRole } from "@/types";
import { 
  getRoleSession, 
  saveRoleSession, 
  clearRoleSession, 
  clearAllRoleSessions,
  getActiveRoleSessions,
  migrateToRoleBasedStorage
} from "@/lib/roleBasedAuth";

interface RoleAuthContextType {
  // Get session for specific role
  getSession: (role: UserRole) => { user: User | null; token: string | null };
  
  // Set session for specific role
  setSession: (role: UserRole, token: string, user: User, additionalData?: Record<string, string>) => void;
  
  // Clear session for specific role
  logout: (role: UserRole) => void;
  
  // Clear all role sessions
  logoutAll: () => void;
  
  // Check if logged in as specific role
  isLoggedInAs: (role: UserRole) => boolean;
  
  // Get all active roles
  activeRoles: UserRole[];
  
  // Loading state
  isLoading: boolean;
}

const RoleAuthContext = createContext<RoleAuthContextType | undefined>(undefined);

export const RoleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoles, setActiveRoles] = useState<UserRole[]>([]);

  // Initialize - migrate old storage and load active roles
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    
    // Migrate old single-session storage to role-based storage
    migrateToRoleBasedStorage();
    
    // Load active role sessions
    const active = getActiveRoleSessions();
    setActiveRoles(active);
    
    setIsLoading(false);
  }, []);

  // Get session for a specific role
  const getSession = useCallback((role: UserRole) => {
    const { token, user } = getRoleSession(role);
    return { token, user };
  }, []);

  // Set session for a specific role
  const setSession = useCallback((
    role: UserRole, 
    token: string, 
    user: User, 
    additionalData?: Record<string, string>
  ) => {
    saveRoleSession(role, token, user, additionalData);
    
    // Update active roles
    setActiveRoles(prev => {
      if (!prev.includes(role)) {
        return [...prev, role];
      }
      return prev;
    });
  }, []);

  // Clear session for a specific role
  const logout = useCallback((role: UserRole) => {
    clearRoleSession(role);
    
    // Update active roles
    setActiveRoles(prev => prev.filter(r => r !== role));
  }, []);

  // Clear all role sessions
  const logoutAll = useCallback(() => {
    clearAllRoleSessions();
    setActiveRoles([]);
  }, []);

  // Check if logged in as specific role
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
