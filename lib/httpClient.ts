import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import { httpLogger } from "./logger";

/**
 * Env variables used:
 * - NEXT_PUBLIC_API_URL      -> Backend API base URL (e.g. http://localhost:4000)
 * - NEXT_PUBLIC_FRONTEND_URL -> Frontend base URL (e.g. http://localhost:3000) [for reference only]
 */

// Determine the base URL for the backend API.
// In the browser we use a same-origin `/api` proxy to avoid CORS.
// On the server we call the backend URL directly.
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return "/api";
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Last‑resort fallback for local development when env is not set.
  return "http://localhost:3000";
};

const baseURL = getBaseURL();

// Log the API URL in development for debugging
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("API Base URL:", baseURL);
  console.log("Backend URL:", process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");
}

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Extend InternalAxiosRequestConfig to include metadata for logging
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime?: number;
  };
  _retry?: boolean;
}

// Request interceptor to add token to requests and log requests
http.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    // Intelligently select which role token to use based on the endpoint
    let token: string | null = null;
    
    if (typeof window === "undefined") {
      // Server-side: try to find any token
      return config;
    }
    
    // First, check the current page path to determine context (most reliable)
    const currentPath = window.location.pathname;
    
    // Check if request has x-business-id header - indicates business owner request
    // Axios normalizes headers, so check both lowercase and the actual header object
    const headers = config.headers || {};
    const hasBusinessIdHeader = !!(headers['x-business-id'] || 
                                   headers['X-Business-Id'] ||
                                   (headers as any)?.['x-business-id']);
    
    // Determine which role context we're in
    if (hasBusinessIdHeader || currentPath.includes('/business-owner')) {
      // Business owner context - use business owner token
      token = localStorage.getItem("business_owner_token");
    } else if (currentPath.includes('/customer')) {
      // Customer context - use customer token
      token = localStorage.getItem("customer_token");
    } else if (currentPath.includes('/service-provider')) {
      // Service provider context - use service provider token
      token = localStorage.getItem("service_provider_token");
    } else if (currentPath.includes('/super-admin')) {
      // Super admin context - use super admin token
      token = localStorage.getItem("super_admin_token");
    } else {
      // Fallback to URL-based detection if path doesn't help
      if (config.url?.includes('/customer')) {
        // Explicit customer endpoints
        token = localStorage.getItem("customer_token");
      } else if (config.url?.includes('/business') || config.url?.includes('/service')) {
        // Business owner endpoints
        token = localStorage.getItem("business_owner_token");
      } else if (config.url?.includes('/provider') || config.url?.includes('/service-provider')) {
        // Service provider endpoints
        token = localStorage.getItem("service_provider_token");
      } else if (config.url?.includes('/admin')) {
        // Admin endpoints
        token = localStorage.getItem("super_admin_token");
      } else if (config.url?.includes('/booking') || config.url?.includes('/contact')) {
        // Booking/contact endpoints - check if we have business context
        // If we're on business-owner page or have business header, use business owner token
        // Otherwise, use customer token as fallback
        if (currentPath.includes('/business-owner') || hasBusinessIdHeader) {
          token = localStorage.getItem("business_owner_token");
        } else {
          token = localStorage.getItem("customer_token");
        }
      } else {
        // Final fallback: try to find any active token (priority order)
        token = localStorage.getItem("business_owner_token")
             || localStorage.getItem("customer_token")
             || localStorage.getItem("service_provider_token")
             || localStorage.getItem("super_admin_token")
             || null;
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Store start time for duration calculation
    config.metadata = {
      startTime: Date.now(),
    };
    
    // Log the request
    httpLogger.logRequest({
      method: config.method || "GET",
      url: config.url || "",
      baseURL: config.baseURL || baseURL,
      headers: config.headers || {},
      data: config.data,
      params: config.params,
    });
    
    return config;
  },
  (error) => {
    // Log request setup errors
    httpLogger.logError({
      method: error.config?.method || "UNKNOWN",
      url: error.config?.url || "UNKNOWN",
      baseURL: error.config?.baseURL || baseURL,
      error,
    });
    
    return Promise.reject(error);
  }
);

// Response interceptor for logging responses and error handling
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = config.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : undefined;
    
    // Log successful response
    httpLogger.logResponse({
      method: config.method || "GET",
      url: config.url || "",
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      duration,
    });
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    const duration = originalRequest?.metadata?.startTime
      ? Date.now() - originalRequest.metadata.startTime
      : undefined;
    
    // Log error with comprehensive details
    httpLogger.logError({
      method: originalRequest?.method || "UNKNOWN",
      url: originalRequest?.url || "UNKNOWN",
      baseURL: originalRequest?.baseURL || baseURL,
      error,
      duration,
    });
    
    // If 401 and not already retried, handle authentication error
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      // List of public endpoints that don't require authentication
      const publicEndpoints = [
        '/contact',
        '/business/slug',
        '/scheduler/available-slots',
        '/service/public',
      ];
      
      // Check if this is a request to a public endpoint
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        originalRequest?.url?.includes(endpoint)
      );
      
      if (typeof window !== "undefined") {
        if (isPublicEndpoint) {
          // For public endpoints, don't redirect to login
          console.warn('401 error on public endpoint:', originalRequest?.url);
        } else {
          // Determine which role session to clear based on current page context
          // This should match the logic in the request interceptor
          const currentPath = window.location.pathname;
          const errorHeaders = originalRequest?.headers || {};
          const hasBusinessIdHeader = !!(errorHeaders['x-business-id'] || 
                                        errorHeaders['X-Business-Id'] ||
                                        (errorHeaders as any)?.['x-business-id']);
          
          let roleToLogout: string | null = null;
          
          // Check current page path first (most reliable)
          if (hasBusinessIdHeader || currentPath.includes('/business-owner')) {
            roleToLogout = 'business_owner';
            localStorage.removeItem("business_owner_token");
            localStorage.removeItem("business_owner_user");
            console.log("Cleared business owner session due to 401");
          } else if (currentPath.includes('/customer')) {
            roleToLogout = 'customer';
            localStorage.removeItem("customer_token");
            localStorage.removeItem("customer_user");
            localStorage.removeItem("customer_businessSiteSlug");
            console.log("Cleared customer session due to 401");
          } else if (currentPath.includes('/service-provider')) {
            roleToLogout = 'service_provider';
            localStorage.removeItem("service_provider_token");
            localStorage.removeItem("service_provider_user");
            console.log("Cleared service provider session due to 401");
          } else if (currentPath.includes('/super-admin')) {
            roleToLogout = 'super_admin';
            localStorage.removeItem("super_admin_token");
            localStorage.removeItem("super_admin_user");
            console.log("Cleared super admin session due to 401");
          } else {
            // Fallback to URL-based detection
            if (originalRequest?.url?.includes('/customer')) {
              roleToLogout = 'customer';
              localStorage.removeItem("customer_token");
              localStorage.removeItem("customer_user");
              localStorage.removeItem("customer_businessSiteSlug");
              console.log("Cleared customer session due to 401");
            } else if (originalRequest?.url?.includes('/business') || originalRequest?.url?.includes('/service')) {
              roleToLogout = 'business_owner';
              localStorage.removeItem("business_owner_token");
              localStorage.removeItem("business_owner_user");
              console.log("Cleared business owner session due to 401");
            } else if (originalRequest?.url?.includes('/provider') || originalRequest?.url?.includes('/service-provider')) {
              roleToLogout = 'service_provider';
              localStorage.removeItem("service_provider_token");
              localStorage.removeItem("service_provider_user");
              console.log("Cleared service provider session due to 401");
            } else if (originalRequest?.url?.includes('/admin')) {
              roleToLogout = 'super_admin';
              localStorage.removeItem("super_admin_token");
              localStorage.removeItem("super_admin_user");
              console.log("Cleared super admin session due to 401");
            } else if (originalRequest?.url?.includes('/booking') || originalRequest?.url?.includes('/contact')) {
              // For booking/contact endpoints, check context
              if (hasBusinessIdHeader || currentPath.includes('/business-owner')) {
                roleToLogout = 'business_owner';
                localStorage.removeItem("business_owner_token");
                localStorage.removeItem("business_owner_user");
                console.log("Cleared business owner session due to 401");
              } else {
                roleToLogout = 'customer';
                localStorage.removeItem("customer_token");
                localStorage.removeItem("customer_user");
                localStorage.removeItem("customer_businessSiteSlug");
                console.log("Cleared customer session due to 401");
              }
            } else {
              // Clear all sessions if we can't determine the role
              localStorage.removeItem("customer_token");
              localStorage.removeItem("customer_user");
              localStorage.removeItem("customer_businessSiteSlug");
              localStorage.removeItem("business_owner_token");
              localStorage.removeItem("business_owner_user");
              localStorage.removeItem("service_provider_token");
              localStorage.removeItem("service_provider_user");
              localStorage.removeItem("super_admin_token");
              localStorage.removeItem("super_admin_user");
              console.log("Cleared all sessions due to 401");
            }
          }
          
          // Redirect to appropriate login page
          if (roleToLogout) {
            window.location.href = `/auth/login/${roleToLogout === 'business_owner' ? 'business-owner' : roleToLogout}`;
          } else {
            window.location.href = "/auth/login";
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);
