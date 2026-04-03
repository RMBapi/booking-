/**
 * Role-Based Authentication Storage
 * 
 * This module provides independent session storage for each role.
 * Users can be logged in as multiple roles simultaneously without conflicts.
 * 
 * Example:
 * - User can be logged in as Business_owner and Customer at the same time
 * - Each role has its own token and user data
 * - Logging out from one role doesn't affect other roles
 */

import { User, UserRole } from "@/types";

/**
 * Storage key prefixes for each role
 */
const ROLE_STORAGE_KEYS = {
  Customer: {
    token: "customer_token",
    user: "customer_user",
    businessSiteSlug: "customer_businessSiteSlug",
  },
  Business_owner: {
    token: "business_owner_token",
    user: "business_owner_user",
  },
  Service_Provider: {
    token: "service_provider_token",
    user: "service_provider_user",
  },
  Super_Admin: {
    token: "super_admin_token",
    user: "super_admin_user",
  },
} as const;

/**
 * Get storage keys for a specific role
 */
export const getRoleStorageKeys = (role: UserRole) => {
  return ROLE_STORAGE_KEYS[role];
};

/**
 * Save token and user for a specific role
 */
export const saveRoleSession = (
  role: UserRole,
  token: string,
  user: User,
  additionalData?: Record<string, string>
) => {
  if (typeof window === "undefined") return; // Skip on server
  
  const keys = getRoleStorageKeys(role);
  
  localStorage.setItem(keys.token, token);
  localStorage.setItem(keys.user, JSON.stringify(user));
  
  // Save additional data (e.g., businessSiteSlug for customers)
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      const storageKey = `${role.toLowerCase()}_${key}`;
      localStorage.setItem(storageKey, value);
    });
  }
  
  console.log(`✅ Saved ${role} session`);
};

/**
 * Get token and user for a specific role
 */
export const getRoleSession = (role: UserRole): {
  token: string | null;
  user: User | null;
  additionalData?: Record<string, string>;
} => {
  if (typeof window === "undefined") {
    // Return null values on server
    return { token: null, user: null, additionalData: {} };
  }
  
  const keys = getRoleStorageKeys(role);
  
  const token = localStorage.getItem(keys.token);
  const userStr = localStorage.getItem(keys.user);
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Get additional data
  const additionalData: Record<string, string> = {};
  if (role === "Customer") {
    const customerKeys = ROLE_STORAGE_KEYS.Customer;
    const businessSiteSlug = localStorage.getItem(customerKeys.businessSiteSlug);
    if (businessSiteSlug) {
      additionalData.businessSiteSlug = businessSiteSlug;
    }
  }
  
  return { token, user, additionalData };
};

/**
 * Clear session for a specific role
 */
export const clearRoleSession = (role: UserRole) => {
  if (typeof window === "undefined") return; // Skip on server
  
  const keys = getRoleStorageKeys(role);
  
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.user);
  
  // Clear additional data
  if (role === "Customer") {
    const customerKeys = ROLE_STORAGE_KEYS.Customer;
    localStorage.removeItem(customerKeys.businessSiteSlug);
  }
  
  console.log(`🗑️ Cleared ${role} session`);
};

/**
 * Check if user is logged in for a specific role
 */
export const isLoggedInAs = (role: UserRole): boolean => {
  const { token, user } = getRoleSession(role);
  return !!(token && user);
};

/**
 * Get all active role sessions
 */
export const getActiveRoleSessions = (): UserRole[] => {
  if (typeof window === "undefined") return []; // Return empty on server
  
  const roles: UserRole[] = ["Customer", "Business_owner", "Service_Provider", "Super_Admin"];
  return roles.filter(role => isLoggedInAs(role));
};

/**
 * Clear all role sessions (complete logout)
 */
export const clearAllRoleSessions = () => {
  if (typeof window === "undefined") return; // Skip on server
  
  const roles: UserRole[] = ["Customer", "Business_owner", "Service_Provider", "Super_Admin"];
  roles.forEach(role => clearRoleSession(role));
  console.log("🗑️ Cleared all role sessions");
};

/**
 * Get redirect path for a role after login
 */
export const getRoleRedirectPath = (role: UserRole): string => {
  switch (role) {
    case "Super_Admin":
      return "/super-admin";
    case "Business_owner":
      return "/business-owner";
    case "Customer":
      return "/customer/dashboard";
    case "Service_Provider":
      return "/service-provider/dashboard";
    default:
      return "/";
  }
};

/**
 * Migrate old single-session storage to role-based storage
 * Call this once to migrate existing users
 */
export const migrateToRoleBasedStorage = () => {
  if (typeof window === "undefined") return; // Skip on server
  
  const oldToken = localStorage.getItem("token");
  const oldUserStr = localStorage.getItem("user");
  
  if (oldToken && oldUserStr) {
    try {
      const oldUser = JSON.parse(oldUserStr);
      const roles = oldUser.roles || (oldUser.role ? [oldUser.role] : []);
      
      if (roles.length > 0) {
        const primaryRole = roles[0] as UserRole;
        console.log(`Migrating old session to ${primaryRole} session`);
        
        saveRoleSession(primaryRole, oldToken, oldUser);
        
        // Clear old storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        console.log("✅ Migration complete");
      }
    } catch (error) {
      console.error("Migration failed:", error);
    }
  }
};
