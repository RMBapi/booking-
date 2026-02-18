/**
 * User Types
 */
export type UserRole = "Customer" | "Service_Provider" | "Business_owner" | "Super_Admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string; // Optional as backend may not send in login response
  roles?: UserRole[]; // Array of roles (used in profile endpoint)
  role?: UserRole; // Single role (backward compatibility)
  activeRole?: UserRole; // Active role context from login (backend sends this in login response)
  isActive?: boolean; // Optional as not sent in login response
  createdAt?: string; // Optional as not sent in login response
  updatedAt?: string; // Optional as not sent in login response
}

export interface CurrentUser extends User {}

/**
 * Authentication Types
 */
export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
  /**
   * Required when role === "Customer"
   * Identifies which business site the customer belongs to
   * Ignored for other roles (Business_owner, Service_Provider, Super_Admin)
   */
  businessSiteSlug?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  /**
   * Required when role === "Customer"
   * Identifies which business site the customer belongs to
   * Ignored for other roles (Business_owner, Service_Provider, Super_Admin)
   */
  businessSiteSlug?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * Business Types
 */
export interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessPayload {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  slug?: string;
}

export interface UpdateBusinessPayload extends Partial<CreateBusinessPayload> {}

export interface UserBusiness {
  id: string;
  business: Business;
}

export interface BusinessOwnerWithBusinesses extends User {
  userBusinesses: UserBusiness[];
}

/**
 * Service Types
 *
 * Note:
 * - `status` is a business-level status field (Active/Inactive/Archived)
 * - `isActive` is a quick on/off toggle for availability
 */
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
  /**
   * Optional because the backend expects `x-business-id` header.
   * We keep it for backward compatibility if the API also accepts it in the body.
   */
  businessId?: string;
  isActive?: boolean;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {}

/**
 * Booking Types
 */
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type ConfirmationMethod = "Email" | "SMS" | "Phone" | "None";
export type BookingSource = "Website" | "Phone" | "WalkIn" | "Mobile";

export interface BookingTime {
  start: string; // ISO 8601 datetime
  end: string;   // ISO 8601 datetime
}

export interface Booking {
  id: string;
  customerId: string;
  customer?: User;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  userId?: string; // Optional - backend can extract from JWT token if not provided
  serviceId: string;
  serviceProviderId?: string; // Optional - backend will assign default if not provided
  bookingTime: BookingTime;
  status?: BookingStatus; // Optional - defaults to "Pending"
  confirmationMethod?: ConfirmationMethod; // Optional
  bookingSource?: BookingSource; // Optional - defaults to "Website"
  customerNotes?: string;
}

export interface CancelBookingPayload {
  cancellationReason: string;
}

/**
 * Contact Types (for non-logged-in users)
 */
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
  bookingTime: BookingTime;
  notes?: string;
}

/**
 * API Response Types
 */
export interface ApiSuccessResponse<T = any> {
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
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Service Provider Types
 */
export interface ServiceProvider {
  id: string;
  serviceId: string;
  userId: string;
  description?: string;
  impUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceProviderPayload {
  serviceId: string;
  userId: string;
  description?: string;
  impUrl?: string;
}

export interface UpdateServiceProviderPayload
  extends Partial<CreateServiceProviderPayload> {}

/**
 * Business Owner Types
 */
export interface CreateBusinessOwnerPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AddOwnerByEmailPayload {
  email: string;
}

export interface BusinessOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

/**
 * Check Business Status Types
 */
export interface CheckBusinessResponse {
  hasBusiness: boolean;
  userId: string;
}

/**
 * Scheduler Types
 */
export interface DaySchedule {
  startTime?: string; // HH:mm format
  endTime?: string;   // HH:mm format
  isOff?: boolean;    // true if day is off
}

export interface BlockedTime {
  startTime: string;  // HH:mm format
  endTime: string;    // HH:mm format
}

export interface TimeSlotConfig {
  intervalMinutes: number;      // e.g., 30 for 30-minute intervals
  allowUserSelection: boolean;   // true if customers can select time slots
  bookingsPerSlot: number;       // 1 for single booking, >1 for multiple
}

export interface CanScheduleTime {
  timeFormat: '12' | '24';
  sunday?: DaySchedule;
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  blockedTimes?: Record<string, BlockedTime[]>;  // day name -> blocked times
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
  start: string;      // ISO 8601 datetime
  end: string;        // ISO 8601 datetime
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;                    // YYYY-MM-DD
  availableSlots: AvailableSlot[];
  timeFormat?: '12' | '24';
  message?: string;
}
