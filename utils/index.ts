import { twMerge } from "tailwind-merge";
import { clsx, ClassValue } from "clsx";
import dayjs from "dayjs";
import type { User, UserRole } from "@/types";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format date using dayjs
 */
export function formatDate(date: string | Date | dayjs.Dayjs, format = "MMM D, YYYY"): string {
  return dayjs(date).format(format);
}

/**
 * Format time using dayjs
 */
export function formatTime(date: string | Date | dayjs.Dayjs, format = "hh:mm:ss A"): string {
  return dayjs(date).format(format);
}

/**
 * Format currency (USD)
 */
export function currencyFormat(value: string | number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

/**
 * Get all user roles in priority order, including activeRole.
 */
export function getUserRoles(user?: User | null): UserRole[] {
  if (!user) return [];

  const roles: UserRole[] = [];

  const addRole = (role?: UserRole) => {
    if (role && !roles.includes(role)) {
      roles.push(role);
    }
  };

  addRole(user.activeRole);
  addRole(user.role);
  user.roles?.forEach(addRole);

  return roles;
}
