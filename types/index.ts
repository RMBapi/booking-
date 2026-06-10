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
  businessId?: string;
}

/**
 * Business Types (read-only for public site)
 */
export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DayOpeningHours {
  isOpen: boolean;
  /** Required when isOpen is true. 24-hour HH:mm */
  open?: string;
  /** Required when isOpen is true. 24-hour HH:mm */
  close?: string;
}

export type OpeningHours = Record<DayKey, DayOpeningHours>;

/** Supported social platforms; the `platform` value drives which icon renders. */
export type SocialPlatform = "facebook" | "instagram";

export interface SocialAccount {
  platform: SocialPlatform;
  /** Public profile link. */
  url: string;
}

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
  /** Optional fallback still shown before a hero video plays. */
  backupImage?: string | null;
  /** Artwork for this business's login page; `null` until the owner sets it. */
  loginImage?: string | null;
  /** Per-business weekly schedule; `null` until the owner configures it in CRM. */
  openingHours?: OpeningHours | null;
  /** Per-business social links; `null` until the owner adds them in CRM. */
  socialAccounts?: SocialAccount[] | null;
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
  image?: string | null;
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
 * Support Ticket / Contact Us Types (customer-facing)
 */
export type TicketType = "Business" | "Platform";

export type TicketStatus =
  | "Open"
  | "InProgress"
  | "WaitingForCustomer"
  | "Resolved"
  | "Closed";

export type MessageAuthor = "Customer" | "Staff" | "System";

export interface TicketMessage {
  id: string;
  authorType: MessageAuthor;
  authorName: string;
  body: string;
  viaEmail: boolean;
  createdAt: string;
}

export interface PersonBrief {
  id: string;
  name: string;
  email: string | null;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  type: TicketType;
  businessId: string | null;
  status: TicketStatus;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterUserId: string | null;
  assignedTo: PersonBrief | null;
  lastReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

/** Logged-in customers send only subject/message (+ optional businessSlug). */
export interface CreateTicketPayload {
  subject: string;
  message: string;
  businessSlug?: string;
}

export interface MyTicketsQuery {
  page?: number;
  limit?: number;
  status?: TicketStatus;
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
