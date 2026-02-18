import { http } from "@/lib";
import {
  CreateServicePayload,
  UpdateServicePayload,
  PaginationParams,
} from "@/types";

/**
 * Service Service
 *
 * All endpoints support scoping by business via the `x-business-id` header.
 */

export const getAllServices = async (
  params?: PaginationParams & {
    status?: string;
    isActive?: boolean;
  },
  businessId?: string
) => {
  // Build query params according to backend API spec:
  // GET /service?page=1&limit=10&search=&status=&isActive=
  // - Empty strings are sent as-is (backend handles them as "all")
  // - Undefined values are omitted
  const cleanParams: Record<string, string | number | boolean> = {};
  
  if (params) {
    // Pagination params
    if (params.page !== undefined) cleanParams.page = params.page;
    if (params.limit !== undefined) cleanParams.limit = params.limit;
    
    // Search: only send if not empty
    if (params.search !== undefined && params.search !== "") {
      cleanParams.search = params.search;
    }
    
    // Status: omit parameter for "all statuses", or send specific status
    // Backend expects: parameter omitted for "all", or status=Active/Inactive/Archived
    // Note: We use undefined (omitted) instead of empty string for "all statuses"
    if (params.status !== undefined && params.status !== "") {
      cleanParams.status = params.status;
    }
    // If status is undefined or empty string, parameter is omitted (backend returns all)
    
    // isActive: send boolean true/false, or omit if undefined (for "all")
    // Backend expects: isActive=true or isActive=false
    // Note: When undefined, we don't send it (backend treats missing param as "all")
    if (params.isActive !== undefined) {
      cleanParams.isActive = params.isActive;
    }
  }

  return http.get("/service", {
    params: cleanParams,
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};

export const getServiceById = async (id: string, businessId?: string) => {
  return http.get(`/service/${id}`, {
    headers: businessId ? { "x-business-id": businessId } : undefined,
  });
};

export const createService = async (
  payload: CreateServicePayload,
  businessId: string
) => {
  return http.post("/service", payload, {
    headers: { "x-business-id": businessId },
  });
};

export const updateService = async (
  id: string,
  payload: UpdateServicePayload,
  businessId: string
) => {
  return http.patch(`/service/${id}`, payload, {
    headers: { "x-business-id": businessId },
  });
};

export const deleteService = async (id: string, businessId: string) => {
  return http.delete(`/service/${id}`, {
    headers: { "x-business-id": businessId },
  });
};

/**
 * Public endpoint to get services by business slug
 * No authentication required - for public business pages
 * 
 * Backend automatically filters for:
 * - status === "Active"
 * - isActive === true
 * 
 * Supports pagination via query parameters:
 * - page (default: 1)
 * - limit (default: 100)
 */
export const getPublicServicesByBusinessSlug = async (
  slug: string,
  params?: { page?: number; limit?: number }
) => {
  // Build query string for pagination
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  
  const queryString = queryParams.toString();
  const url = `/api/business/slug/${slug}/services${queryString ? `?${queryString}` : ""}`;
  
  try {
    // Log the URL being called for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Fetching services from:", url);
    }
    
    // Public endpoint - no auth required (use same-origin proxy to avoid CORS)
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    // Check if response is ok
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `Failed to fetch services: ${response.status} ${response.statusText}`;
      let errorData: any = null;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        } catch (textError) {
          // If text parsing also fails, use default message
          console.warn("Could not parse error response");
        }
      }
      
      // Log for debugging with proper serialization - log each property separately
      console.error("❌ Service fetch error:");
      console.error("  URL:", url);
      console.error("  Status:", response.status);
      console.error("  Status Text:", response.statusText);
      console.error("  Error Message:", errorMessage);
      if (errorData) {
        console.error("  Error Data:", JSON.stringify(errorData, null, 2));
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Enhanced error logging - log each property separately to avoid serialization issues
    console.error("❌ Error fetching public services:");
    console.error("  Slug:", slug);
    console.error("  URL:", url);
    console.error("  Error Type:", error instanceof Error ? "Error" : typeof error);
    console.error("  Error Message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("  Error Stack:", error.stack);
    }
    console.error("  Full error:", error);
    
    throw error;
  }
};
