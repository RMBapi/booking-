/**
 * User Types
 */
export type UserRole = "Customer";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles?: UserRole[];
  role?: UserRole;
  activeRole?: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Authentication Types
 */
export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
  businessSiteSlug?: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  businessSiteSlug?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * Business Types (read-only for public site)
 */
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
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service Types (read-only for public site)
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
  allowCustomerChooseProvider?: boolean;
  showProvider?: boolean;
  providers?: ServiceProviderSummary[];
  business?: Business;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service Provider Summary (embedded in Service for public display)
 */
export interface ServiceProviderSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  description?: string;
  impUrl?: string;
}

/**
 * Booking Types
 */
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type ConfirmationMethod = "Email" | "SMS" | "Phone" | "None";
export type BookingSource = "Website" | "Phone" | "WalkIn" | "Mobile";

export interface BookingTime {
  start: string;
  end: string;
}

export interface BookingServiceProvider {
  id: string;
  impUrl?: string | null;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface BookingReview {
  id: string;
  bookingId?: string;
  userId?: string;
  businessId?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customer?: User;
  serviceId: string;
  service?: Service;
  serviceProviderId: string;
  serviceProvider?: BookingServiceProvider;
  businessId: string;
  business?: Business;
  bookingTime: BookingTime;
  status: BookingStatus;
  confirmationMethod: ConfirmationMethod;
  bookingSource: BookingSource;
  customerNotes?: string;
  cancellationReason?: string;
  review?: BookingReview | null;
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

export interface CancelBookingPayload {
  cancellationReason: string;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

/**
 * Contact Types (for non-logged-in users submitting booking requests)
 */
export interface CreateContactPayload {
  serviceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingTime?: BookingTime;
  notes?: string;
}

/**
 * API Response Types
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
}

/**
 * Scheduler Types (read-only for available slots)
 */
export interface AvailableSlot {
  start: string;
  end: string;
  status?: string;
  available: boolean;
  bookedCount?: number;
  capacity?: number;
}

export interface AvailableSlotsResponse {
  date: string;
  availableSlots: AvailableSlot[];
  slots?: AvailableSlot[];
  providers?: ServiceProviderSummary[];
  showProvider?: boolean;
  capacityScope?: string;
  timeFormat?: "12" | "24";
  message?: string;
}
