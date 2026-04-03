import axios, { AxiosError as HTTPError } from "axios";
import * as toast from "@/lib/toast";

type ApiError = {
  error: {
    httpReasonPhrase: string;
    httpStatusCode: number;
  };
  message: string | string[];
  statusCode: number;
};

const genericMessage = "Something went wrong. Please try again.";
const networkErrorMessage = "Unable to connect. Please check your internet connection.";

/**
 * Extracts a short, user-friendly error message from an Axios error
 */
function getShortAxiosErrorMessage(err: HTTPError<ApiError>): string {
  const statusCode =
    err.response?.data?.error?.httpStatusCode ||
    err.response?.data?.statusCode ||
    err.response?.status;

  // Network errors (no response)
  if (!err.response) {
    return networkErrorMessage;
  }

  const message = err.response?.data?.message || err.message;

  // Handle array of messages (validation errors) - show first error or summary
  if (Array.isArray(message)) {
    if (message.length === 1) {
      return message[0];
    }
    // For multiple validation errors, show a summary
    return `Validation failed: ${message.length} error(s)`;
  }

  // Client errors (4xx) - show short message
  if (statusCode && statusCode >= 400 && statusCode <= 499) {
    // Truncate long messages for better UX
    const shortMessage = typeof message === "string" && message.length > 100 
      ? message.substring(0, 100) + "..."
      : message;
    return shortMessage || "Invalid request. Please check your input.";
  }

  // Server errors (5xx) - always show generic message
  if (statusCode && statusCode >= 500 && statusCode <= 599) {
    return genericMessage;
  }

  return genericMessage;
}

/**
 * Safe public extractor used by hooks/components that need inline error text.
 */
export function extractApiErrorMessage(err: unknown): string {
  if (!err) return genericMessage;

  if (!axios.isAxiosError<ApiError>(err)) {
    return genericMessage;
  }

  return getShortAxiosErrorMessage(err);
}

export const useApiError = () => {
  function handleError(err: unknown) {
    if (!err) return;

    // Show short message in toast (UI)
    const shortMessage = extractApiErrorMessage(err);
    toast.error(shortMessage);

    // Full error details are already logged to console by the HTTP logger
    // No need to log here again to avoid duplication
  }

  return { handleError };
};
