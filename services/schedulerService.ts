import { http } from "@/lib";

/**
 * Scheduler Service
 *
 * All endpoints require:
 * - Authorization: Bearer {token} header
 * - x-business-id: {businessId} header
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

/**
 * Create a scheduler configuration for a service
 */
export const createScheduler = async (
  businessId: string,
  data: CreateSchedulerRequest
) => {
  return http.post("/scheduler", data, {
    headers: { "x-business-id": businessId },
  });
};

/**
 * Get scheduler configuration for a service
 */
export const getScheduler = async (
  businessId: string,
  serviceId: string
) => {
  return http.get(`/scheduler/service/${serviceId}`, {
    headers: { "x-business-id": businessId },
  });
};

/**
 * Update scheduler configuration for a service
 */
export const updateScheduler = async (
  businessId: string,
  serviceId: string,
  data: UpdateSchedulerRequest
) => {
  return http.patch(`/scheduler/service/${serviceId}`, data, {
    headers: { "x-business-id": businessId },
  });
};

/**
 * Delete scheduler configuration for a service
 */
export const deleteScheduler = async (
  businessId: string,
  serviceId: string
) => {
  return http.delete(`/scheduler/service/${serviceId}`, {
    headers: { "x-business-id": businessId },
  });
};

/**
 * Get available time slots for booking on a specific date
 * This endpoint is used by customers when booking a service
 * Now supports public access via businessSlug (no auth required)
 */
export const getAvailableSlots = async (
  serviceId: string,
  options: {
    date?: string;              // YYYY-MM-DD format
    serviceProviderId?: string;
    businessId?: string;        // Optional - for authenticated requests
    businessSlug?: string;      // Optional - for public requests
  } = {}
) => {
  const params = new URLSearchParams({
    serviceId,
  });
  
  if (options.date) {
    params.append('date', options.date);
  }
  
  if (options.serviceProviderId) {
    params.append('serviceProviderId', options.serviceProviderId);
  }

  if (options.businessSlug) {
    params.append('businessSlug', options.businessSlug);
  }
  
  const headers: Record<string, string> = {};
  if (options.businessId) {
    headers["x-business-id"] = options.businessId;
  }
  
  return http.get(`/scheduler/available-slots?${params.toString()}`, {
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
};
