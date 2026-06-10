import axios, {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { httpLogger } from "./logger";
import { isPublicEndpoint } from "./auth";
import { getAccessToken, getActiveBusinessId } from "./api/accessToken";
import { refreshAccess, isTransientError } from "./api/refresh";

const getBaseURL = () => {
  if (typeof window !== "undefined") return "/api";
  return process.env.NEXT_PUBLIC_API_URL;
};

const baseURL = getBaseURL();

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("API Base URL:", baseURL);
}

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime?: number };
  _retry?: boolean;
}

function hasBusinessIdHeader(headers: unknown): boolean {
  if (!headers || typeof headers !== "object") return false;
  const h = headers as Record<string, unknown>;
  return !!(h["X-Business-Id"] || h["x-business-id"]);
}

function urlContainsBusinessIdSegment(url: string): boolean {
  // /business/:id/* routes carry the id in the path; the header is
  // redundant there. Don't treat /business/slug/* as business-scoped.
  return /\/business\/[0-9a-f-]{8,}/i.test(url);
}

// ─── Request interceptor ─────────────────────────────────────────────────

http.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    if (typeof window === "undefined") return config;

    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const url = config.url ?? "";
    if (
      !hasBusinessIdHeader(config.headers) &&
      !urlContainsBusinessIdSegment(url)
    ) {
      const bid = getActiveBusinessId();
      if (bid) {
        config.headers["X-Business-Id"] = bid;
      }
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

// ─── Response interceptor ────────────────────────────────────────────────

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

    const shouldAttemptRefresh =
      status === 401 &&
      !!config &&
      !config._retry &&
      !isPublicEndpoint(url) &&
      !url.includes("/auth/refresh");

    if (shouldAttemptRefresh && config) {
      config._retry = true;
      try {
        const fresh = await refreshAccess();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${fresh}`;
        }
        return http.request(config);
      } catch (refreshErr) {
        // Only force logout when the session is genuinely invalid. Covers both
        // the refresh itself (RefreshError) and the retried request (axios
        // error) failing transiently — backend down / 5xx must NOT log out;
        // only a real 401/403 does.
        if (isTransientError(refreshErr)) {
          return Promise.reject(error);
        }
        window.dispatchEvent(new CustomEvent("auth:unauthenticated"));
      }
    }

    if (status === 403) {
      const detail = {
        url,
        message:
          (error.response?.data as Record<string, unknown> | undefined)
            ?.message ?? "You don't have permission to do this.",
      };
      window.dispatchEvent(new CustomEvent("auth:forbidden", { detail }));
    }

    return Promise.reject(error);
  },
);
