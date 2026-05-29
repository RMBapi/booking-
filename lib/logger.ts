/**
 * HTTP Request Logger Utility
 * Provides structured logging for HTTP requests, responses, and errors
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
  logHeaders: boolean;
  logBody: boolean;
}

const defaultConfig: LogConfig = {
  enabled: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENABLE_HTTP_LOGGING === "true",
  level: "info",
  logRequests: true,
  logResponses: true,
  logErrors: true,
  logHeaders: process.env.NODE_ENV === "development",
  logBody: process.env.NODE_ENV === "development",
};

class HttpLogger {
  private config: LogConfig;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    if (!this.config.logHeaders) {
      return { "Content-Type": headers["Content-Type"] || "application/json" };
    }

    // Mask sensitive headers
    const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
    const formatted: Record<string, unknown> = {};

    Object.keys(headers).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        formatted[key] = "***REDACTED***";
      } else {
        formatted[key] = headers[key];
      }
    });

    return formatted;
  }

  private formatBody(body: unknown): unknown {
    if (!this.config.logBody) {
      return body ? "[Body hidden]" : undefined;
    }

    // Mask sensitive fields in body
    if (typeof body === "object" && body !== null) {
      const sensitiveFields = ["password", "token", "secret", "apiKey", "accessToken", "refreshToken"];
      const formatted = { ...(body as Record<string, unknown>) };

      sensitiveFields.forEach((field) => {
        if (formatted[field]) {
          formatted[field] = "***REDACTED***";
        }
      });

      return formatted;
    }

    return body;
  }

  logRequest(config: {
    method: string;
    url: string;
    baseURL?: string;
    headers: Record<string, unknown>;
    data?: unknown;
    params?: unknown;
  }) {
    if (!this.shouldLog("info") || !this.config.logRequests) return;

    const fullUrl = config.baseURL
      ? `${config.baseURL}${config.url}`
      : config.url;

    const logData: Record<string, unknown> = {
      timestamp: this.formatTimestamp(),
      type: "REQUEST",
      method: config.method.toUpperCase(),
      url: fullUrl,
      headers: this.formatHeaders(config.headers),
    };

    if (config.params) {
      logData.params = config.params;
    }

    if (config.data) {
      logData.body = this.formatBody(config.data);
    }

    console.group(`🔵 [HTTP REQUEST] ${config.method.toUpperCase()} ${config.url}`);
    console.log("Timestamp:", logData.timestamp);
    console.log("Method:", logData.method);
    console.log("URL:", logData.url);
    if (config.params) {
      console.log("Query Params:", logData.params);
    }
    if (this.config.logHeaders) {
      console.log("Headers:", logData.headers);
    }
    if (config.data && this.config.logBody) {
      console.log("Body:", logData.body);
    }
    console.groupEnd();
  }

  logResponse(config: {
    method: string;
    url: string;
    status: number;
    statusText: string;
    data?: unknown;
    headers?: Record<string, unknown>;
    duration?: number;
  }) {
    if (!this.shouldLog("info") || !this.config.logResponses) return;

    const isSuccess = config.status >= 200 && config.status < 300;
    const emoji = isSuccess ? "🟢" : "🟡";

    console.group(`${emoji} [HTTP RESPONSE] ${config.method.toUpperCase()} ${config.url}`);
    console.log("Timestamp:", this.formatTimestamp());
    console.log("Status:", `${config.status} ${config.statusText}`);
    if (config.duration !== undefined) {
      console.log("Duration:", `${config.duration}ms`);
    }
    if (this.config.logHeaders && config.headers) {
      console.log("Headers:", this.formatHeaders(config.headers));
    }
    if (this.config.logBody && config.data) {
      // Show full backend response data for debugging
      console.log("Backend Response Data:", JSON.stringify(config.data, null, 2));
    }
    console.groupEnd();
  }

  logError(config: {
    method: string;
    url: string;
    baseURL?: string;
    error: unknown;
    duration?: number;
  }) {
    if (!this.shouldLog("error") || !this.config.logErrors) return;

    const fullUrl = config.baseURL
      ? `${config.baseURL}${config.url}`
      : config.url;

    const error = config.error as {
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
        headers?: Record<string, unknown>;
      };
      request?: unknown;
    };
    const response = error?.response;
    const request = error?.request;

    console.group(`🔴 [HTTP ERROR] ${config.method.toUpperCase()} ${config.url}`);
    console.log("Timestamp:", this.formatTimestamp());
    console.log("Error Message:", error?.message || "Unknown error");

    if (response) {
      // Server responded with error status
      console.log("Status:", `${response.status} ${response.statusText || ""}`);
      console.log("Backend Response Data:", JSON.stringify(response.data, null, 2));
      if (this.config.logHeaders && response.headers) {
        console.log("Response Headers:", this.formatHeaders(response.headers));
      }
    } else if (request) {
      // Request was made but no response received
      console.log("Error Type:", "Network Error / No Response");
      console.log("Request URL:", fullUrl);
      console.log("Possible Causes:", [
        "Backend server is not running",
        "CORS is not configured on the backend",
        "Network connectivity issues",
        "The API URL is incorrect",
      ]);
    } else {
      // Error setting up the request
      console.log("Error Type:", "Request Setup Error");
      console.log("Error Details:", error);
    }

    if (config.duration !== undefined) {
      console.log("Duration:", `${config.duration}ms`);
    }

    // Log full error object in development
    if (process.env.NODE_ENV === "development") {
      console.log("Full Error Object:", error);
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const httpLogger = new HttpLogger();

// Export class for custom instances if needed
export { HttpLogger };
export type { LogConfig, LogLevel };
