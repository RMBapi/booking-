/**
 * Canonical permission codes (stored in DB `Permission.code`).
 * Use these with @Permissions(...) for compile-time safety and refactors.
 */
export const Permission = {
  /** Admin: list business owners */
  ADMIN_BUSINESS_OWNER_LIST: 'admin:business_owner:list',
  /** Admin: read one business owner */
  ADMIN_BUSINESS_OWNER_READ: 'admin:business_owner:read',
  /** Update arbitrary user profile (admin tooling) */
  USER_UPDATE: 'user:update',

  /** Customer: create a booking */
  BOOKING_CREATE: 'booking:create',
  /** Customer: see own bookings */
  BOOKING_VIEW_OWN: 'booking:view:own',

  /** Business staff: bookings for their business */
  BOOKING_VIEW_BUSINESS: 'booking:view:business',

  /** Staff: read services in scope */
  SERVICE_READ: 'service:read',
} as const;

export type PermissionCode = (typeof Permission)[keyof typeof Permission];
