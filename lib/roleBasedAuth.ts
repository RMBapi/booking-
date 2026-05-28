/**
 * Role-Based Authentication Storage
 *
 * Manages session persistence for the Customer role in localStorage.
 */

import { User, UserRole } from "@/types";

const STORAGE_KEYS = {
  token: "customer_token",
  user: "customer_user",
  businessSiteSlug: "customer_businessSiteSlug",
} as const;

export const saveRoleSession = (
  _role: UserRole,
  token: string,
  user: User,
  additionalData?: Record<string, string>
) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      localStorage.setItem(`customer_${key}`, value);
    });
  }
};

export const getRoleSession = (
  _role: UserRole
): {
  token: string | null;
  user: User | null;
  additionalData?: Record<string, string>;
} => {
  if (typeof window === "undefined") {
    return { token: null, user: null, additionalData: {} };
  }

  const token = localStorage.getItem(STORAGE_KEYS.token);
  const userStr = localStorage.getItem(STORAGE_KEYS.user);
  const user = userStr ? JSON.parse(userStr) : null;

  const additionalData: Record<string, string> = {};
  const businessSiteSlug = localStorage.getItem(STORAGE_KEYS.businessSiteSlug);
  if (businessSiteSlug) {
    additionalData.businessSiteSlug = businessSiteSlug;
  }

  return { token, user, additionalData };
};

export const clearRoleSession = (_role: UserRole) => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.businessSiteSlug);
};

export const isLoggedInAs = (_role: UserRole): boolean => {
  const { token, user } = getRoleSession("Customer");
  return !!(token && user);
};

export const getActiveRoleSessions = (): UserRole[] => {
  if (typeof window === "undefined") return [];
  return isLoggedInAs("Customer") ? ["Customer"] : [];
};

export const clearAllRoleSessions = () => {
  clearRoleSession("Customer");
};

export const getCustomerHomePath = (): string => {
  if (typeof window !== "undefined") {
    const slug =
      localStorage.getItem(STORAGE_KEYS.businessSiteSlug) ||
      process.env.NEXT_PUBLIC_BUSINESS_SLUG;
    if (slug) return `/business/slug/${slug}`;
  }

  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG;
  if (envSlug) return `/business/slug/${envSlug}`;

  return "/";
};

export const getRoleRedirectPath = (_role: UserRole): string => {
  return getCustomerHomePath();
};

export const migrateToRoleBasedStorage = () => {
  if (typeof window === "undefined") return;

  const oldToken = localStorage.getItem("token");
  const oldUserStr = localStorage.getItem("user");

  if (oldToken && oldUserStr) {
    try {
      const oldUser = JSON.parse(oldUserStr);
      saveRoleSession("Customer", oldToken, oldUser);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      /* ignore corrupt legacy data */
    }
  }
};
