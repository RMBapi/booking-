/**
 * User & Auth Types
 *
 * Per docs/rbac.md and docs/frontend-integration.md:
 * - One user has exactly one systemRole (set at registration).
 * - A user belongs to zero or more businesses via UserBusiness rows.
 * - Inside a business, role is Business_owner or Service_Provider.
 * - permissions[] on each membership is the full feature set (server fills it).
 */

export type SystemRole =
  | "Super_Admin"
  | "Business_owner"
  | "Service_Provider"
  | "Customer";

export type BusinessRole = "Business_owner" | "Service_Provider";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  systemRole: SystemRole;
  createdAt: string;
  /** Always present in /auth/me. True when user must change password before continuing. */
  passwordChangeRequired: boolean;
}

/**
 * Per-membership lifecycle on UserBusiness.status.
 * - Pending: account exists but cannot enter the dashboard yet.
 * - Active: full access (subject to permissions).
 * - Deactivated: revoked; cannot enter, login is rejected when *all*
 *   memberships are non-Active.
 */
export type MemberStatus = "Pending" | "Active" | "Deactivated";

export interface BusinessMembership {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: BusinessRole;
  status: MemberStatus;
  /**
   * Full feature set. Trust the array as-is — the server fills it with
   * ALL_FEATURES for Business_owner and the actual grants for Service_Provider.
   */
  permissions: string[];
}

export interface MeResponse {
  user: User;
  businesses: BusinessMembership[];
  /** Set client-side after fetch; not part of the wire payload. */
  fetchedAt?: number;
}

export interface AuthLoginPayload {
  email: string;
  password: string;
  /** Required when the user is a Customer. */
  businessSiteSlug?: string;
}

export interface AuthRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "Customer" | "Business_owner" | "Service_Provider";
  /** Optional, only used when role=Business_owner. Backend auto-creates the business. */
  businessName?: string;
  /** Required when role=Customer. */
  businessSiteSlug?: string;
  /** Optional, auto-accepts a pending invitation. */
  invitationToken?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    systemRole: SystemRole;
    isActive?: boolean;
  };
}

// ─── Feature codes (mirrors backend src/common/constants/permissions.ts) ────

export const FEATURES = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_BOOKINGS: "view_bookings",
  MANAGE_BOOKINGS: "manage_bookings",
  VIEW_SERVICES: "view_services",
  MANAGE_SERVICES: "manage_services",
  VIEW_CONTACTS: "view_contacts",
  MANAGE_CONTACTS: "manage_contacts",
  VIEW_PROVIDERS: "view_providers",
  MANAGE_PROVIDERS: "manage_providers",
  VIEW_CALENDAR: "view_calendar",
  VIEW_SETTINGS: "view_settings",
  MANAGE_TEAM: "manage_team",
  MANAGE_BUSINESS: "manage_business",
} as const;

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES];

// ─── Team management ────────────────────────────────────────────────────────

export interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: BusinessRole;
  permissions: string[];
  status: MemberStatus;
  joinedAt: string;
}

export interface AddTeamMemberPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: BusinessRole;
  /** Full set, not a delta. Ignored by backend when role=Business_owner. */
  permissions: string[];
  /**
   * Owner-set initial password (min 8 chars). Shared out-of-band; the new
   * user is forced to change it on first login.
   */
  password: string;
}

export interface UpdateTeamMemberPayload {
  role?: BusinessRole;
  /** Replaces the full set; pass [] to clear. */
  permissions?: string[];
  status?: MemberStatus;
}

export interface AvailableFeature {
  code: FeatureCode;
  label: string;
  description: string;
}

// ─── Activation ─────────────────────────────────────────────────────────────

export type ActivationView =
  | { valid: true; email: string; firstName: string; businessName: string }
  | { valid: false; expired?: boolean; consumed?: boolean };

// ─── Invitations ────────────────────────────────────────────────────────────

export interface InvitationView {
  businessName: string;
  email: string;
  role: BusinessRole;
  isExpired: boolean;
  isRevoked: boolean;
  isAccepted: boolean;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: BusinessRole;
  createdAt: string;
  expiresAt: string;
}

export interface CreateInvitationPayload {
  email: string;
  role?: BusinessRole;
}

// ─── Business ───────────────────────────────────────────────────────────────

export interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessPayload {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  image?: string;
  slug?: string;
}

export interface UpdateBusinessPayload extends Partial<CreateBusinessPayload> {}

// ─── Service ────────────────────────────────────────────────────────────────

export type ServiceStatus = "Active" | "Inactive" | "Archived";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: ServiceStatus;
  priceDisplayMode: boolean;
  isActive: boolean;
  businessId: string;
  allowCustomerChooseProvider?: boolean;
  showProvider?: boolean;
  providers?: ServiceProviderSummary[];
  business?: Business;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  price: number;
  status: ServiceStatus;
  priceDisplayMode: boolean;
  allowCustomerChooseProvider?: boolean;
  businessId?: string;
  isActive?: boolean;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {}

// ─── Booking ────────────────────────────────────────────────────────────────

export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type ConfirmationMethod = "Email" | "SMS" | "Phone" | "None";
export type BookingSource =
  | "Website"
  | "Phone"
  | "WalkIn"
  | "Mobile"
  | "CRM";

export interface BookingTime {
  start: string;
  end: string;
}

/**
 * Customer attached to a booking. For registered users, `id` is the user's
 * UUID. For guest bookings (created via POST /booking/staff with a `guest`
 * block), the BE hydrates this from the snapshot — `id` is null and
 * `isGuest` is true.
 */
export interface BookingCustomer {
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  systemRole?: SystemRole;
  createdAt?: string;
  isGuest?: boolean;
}

export interface Booking {
  id: string;
  userId: string | null;
  user?: BookingCustomer;
  customer?: BookingCustomer;
  serviceId: string;
  service?: Service;
  serviceProviderId: string;
  serviceProvider?: User;
  businessId: string;
  business?: Business;
  bookingTime: BookingTime;
  status: BookingStatus;
  confirmationMethod: ConfirmationMethod;
  bookingSource: BookingSource;
  customerNotes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  userId?: string;
  serviceId: string;
  serviceProviderId?: string;
  bookingTime: BookingTime;
  status?: BookingStatus;
  confirmationMethod?: ConfirmationMethod;
  bookingSource?: BookingSource;
  customerNotes?: string;
}

export interface StaffBookingGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * POST /booking/staff payload. Caller must supply `userId` XOR `guest` —
 * sending both is a 400. `bookingSource` defaults to "CRM" server-side.
 */
export interface CreateStaffBookingPayload {
  userId?: string;
  guest?: StaffBookingGuest;
  serviceId: string;
  serviceProviderId?: string;
  bookingTime: BookingTime;
  status?: BookingStatus;
  confirmationMethod?: ConfirmationMethod;
  bookingSource?: Extract<BookingSource, "CRM" | "Phone" | "WalkIn">;
  customerNotes?: string;
}

/** GET /user/lookup?email=... — 200 payload. 404 means no match. */
export interface UserLookupResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  systemRole: SystemRole;
}

export interface CancelBookingPayload {
  cancellationReason: string;
}

// ─── Contact ────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  businessId: string;
  business?: Business;
  serviceId: string;
  service?: Service;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingTime: BookingTime;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactPayload {
  serviceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingTime?: BookingTime;
  notes?: string;
}

// ─── API envelopes ──────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BookingListQuery extends PaginationParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: BookingStatus;
  userId?: string;
  serviceId?: string;
  serviceProviderId?: string;
}

export interface ContactListQuery extends PaginationParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  email?: string;
  phone?: string;
  serviceId?: string;
}

// ─── Service Provider ──────────────────────────────────────────────────────

export interface ServiceProvider {
  id: string;
  serviceId: string;
  userId: string;
  description?: string;
  impUrl?: string;
  firstName?: string;
  lastName?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProviderSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  description?: string;
  impUrl?: string;
}

export interface CreateServiceProviderPayload {
  serviceId: string;
  userId: string;
  description?: string;
  impUrl?: string;
}

export interface UpdateServiceProviderPayload
  extends Partial<CreateServiceProviderPayload> {}

// ─── Super_Admin ────────────────────────────────────────────────────────────

/**
 * POST /admin/business-owners
 *
 * Owner-creation now provisions only the user account (no business). The
 * Super_Admin types a temporary password and shares it out-of-band; the
 * owner is forced to change it on first login (passwordChangeRequired=true)
 * and self-onboards their business via /onboarding/business.
 */
export interface CreateBusinessOwnerDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface BusinessOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  passwordChangeRequired: boolean;
  /**
   * Empty array until the owner self-onboards. Used by the admin list to
   * derive the "Onboarding" status.
   */
  userBusinesses: Array<{ id: string }>;
  createdAt: string;
}

// ─── Auth: change password / onboarding ─────────────────────────────────────

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  accessToken: string;
  user: User;
}

/**
 * POST /business/onboarding — Business_owner self-onboards their first
 * business. Backend takes `slug` literally; frontend MUST auto-generate
 * a valid one (lowercase, dashes, no special chars).
 */
export interface CreateOwnBusinessDto {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
  image?: string;
}

// ─── Scheduler ──────────────────────────────────────────────────────────────

export interface DaySchedule {
  startTime?: string;
  endTime?: string;
  isOff?: boolean;
}

export interface BlockedTime {
  startTime: string;
  endTime: string;
}

export interface TimeSlotConfig {
  intervalMinutes: number;
  allowUserSelection: boolean;
  bookingsPerSlot: number;
}

export interface CanScheduleTime {
  timeFormat: "12" | "24";
  sunday?: DaySchedule;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  blockedTimes?: Record<string, BlockedTime[]>;
  timeSlotConfig: TimeSlotConfig;
}

export interface Scheduler {
  id: string;
  serviceId: string;
  canScheduleTime: CanScheduleTime;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchedulerRequest {
  serviceId: string;
  canScheduleTime: CanScheduleTime;
}

export interface UpdateSchedulerRequest {
  canScheduleTime: Partial<CanScheduleTime>;
}

export interface AvailableSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  availableSlots: AvailableSlot[];
  timeFormat?: "12" | "24";
  message?: string;
}
