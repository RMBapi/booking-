import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { httpLogger } from "./logger";
import {
  resolveToken,
  resolveRoleForLogout,
  clearRoleSession,
  clearAllRoleSessions,
  isPublicEndpoint,
  getLoginPathForRole,
  shouldForceLogoutOn401,
} from "./auth";

/**
 * Env variables:
 * - NEXT_PUBLIC_API_URL  → Backend base URL (e.g. http://localhost:4000)
 */

const getBaseURL = () => {
  if (typeof window !== "undefined") return "/api";
  return process.env.NEXT_PUBLIC_API_URL;
};

const baseURL = getBaseURL();

const REQUEST_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 20000,
);

export const http = axios.create({
  baseURL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Extended config for metadata ────────────────────────────────────────────

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime?: number };
  _retry?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasBusinessIdHeader(headers: Record<string, unknown>): boolean {
  return !!(
    headers["x-business-id"] ||
    headers["X-Business-Id"] ||
    (headers as Record<string, unknown>)?.["x-business-id"]
  );
}

// ─── Request interceptor ─────────────────────────────────────────────────────

http.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    if (typeof window === "undefined") return config;

    const token = resolveToken({
      pagePath: window.location.pathname,
      requestUrl: config.url ?? "",
      hasBusinessIdHeader: hasBusinessIdHeader(
        (config.headers ?? {}) as Record<string, unknown>,
      ),
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.metadata = { startTime: Date.now() };

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
    httpLogger.logError({
      method: error.config?.method || "UNKNOWN",
      url: error.config?.url || "UNKNOWN",
      baseURL: error.config?.baseURL || baseURL,
      error,
    });
    return Promise.reject(error);
  },
);

// ─── Response interceptor ────────────────────────────────────────────────────

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = config.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : undefined;

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
    const config = error.config as ExtendedAxiosRequestConfig | undefined;
    const duration = config?.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : undefined;

    httpLogger.logError({
      method: config?.method || "UNKNOWN",
      url: config?.url || "UNKNOWN",
      baseURL: config?.baseURL || baseURL,
      error,
      duration,
    });

    if (typeof window === "undefined") return Promise.reject(error);

    const status = error.response?.status;
    const url = config?.url ?? "";

    // ── 401: session invalid → clear that role, redirect to login ──────────
    if (status === 401 && !config?._retry) {
      if (config) config._retry = true;

      if (isPublicEndpoint(url)) {
        return Promise.reject(error);
      }

      if (!shouldForceLogoutOn401(url, config?.method)) {
        return Promise.reject(error);
      }

      const role = resolveRoleForLogout({
        pagePath: window.location.pathname,
        requestUrl: url,
        hasBusinessIdHeader: hasBusinessIdHeader(
          (config?.headers ?? {}) as Record<string, unknown>,
        ),
      });

      const returnUrl = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      const loginBase = role ? getLoginPathForRole(role) : "/auth/login";

      if (role) {
        clearRoleSession(role);
        window.location.href = `${loginBase}?returnUrl=${returnUrl}`;
      } else {
        clearAllRoleSessions();
        window.location.href = `${loginBase}?returnUrl=${returnUrl}`;
      }
    }

    // ── 403: permission denied → dispatch event for UI handling ─────────
    // We do NOT logout. Components can listen for this event to show
    // an "Access Denied" message via the useAuth hook or AccessDenied component.
    if (status === 403) {
      const detail = {
        url,
        message:
          (error.response?.data as Record<string, unknown>)?.message ??
          "You do not have permission to perform this action.",
      };
      window.dispatchEvent(new CustomEvent("auth:forbidden", { detail }));
    }

    return Promise.reject(error);
  },
);
