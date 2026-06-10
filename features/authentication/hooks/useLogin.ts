import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login as loginApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { useRoleAuth } from "@/contexts";
import { AuthResponse, LoginPayload } from "@/types";
import { getRoleRedirectPath } from "@/lib";
import { extractApiErrorMessage } from "@/hooks/api-response";

type MutationResponse = AxiosResponse<AuthResponse>;

export const useLogin = () => {
  const { handleSuccess, handleError } = useApiResponse();
  const { setSession } = useRoleAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isPending: isLogging, mutate: login } = useMutation<
    MutationResponse,
    unknown,
    LoginPayload
  >({
    mutationFn: (variables) => {
      setErrorMessage(null);
      return loginApi(variables);
    },
    onSuccess: (response, variables) => {
      const { accessToken, user, businessId } = response.data || {};

      if (!user || !accessToken) {
        handleError(new Error("Invalid response: missing user or token"));
        return;
      }

      const loginRole = "Customer" as const;
      const additionalData: Record<string, string> = {};

      if (variables.businessSiteSlug) {
        additionalData.businessSiteSlug = variables.businessSiteSlug;
      }
      if (businessId) {
        additionalData.businessId = businessId;
      }

      setSession(loginRole, accessToken, user, additionalData);
      handleSuccess("Login successful!");

      const returnUrl = searchParams?.get("returnUrl");
      const redirectPath = returnUrl || getRoleRedirectPath(loginRole);
      router.replace(redirectPath);
    },
    onError: (error) => {
      const parsedMessage = extractApiErrorMessage(error);
      const normalizedMessage = parsedMessage.toLowerCase();

      if (
        normalizedMessage.includes("unauthorized") ||
        normalizedMessage.includes("invalid credential") ||
        normalizedMessage.includes("invalid password")
      ) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (normalizedMessage.includes("already registered")) {
        // User is already registered with this business — redirect to login
        setErrorMessage(
          "You are already registered with this business. Please log in.",
        );
      } else if (normalizedMessage.includes("deactivated")) {
        setErrorMessage(
          "Your account has been deactivated by this business. Please contact support.",
        );
      } else if (normalizedMessage.includes("pending activation")) {
        setErrorMessage(
          "Your account is pending activation by this business. Please check back soon.",
        );
      } else {
        setErrorMessage(parsedMessage);
      }

      handleError(error);
    },
  });

  const clearError = () => setErrorMessage(null);

  return { login, isLogging, errorMessage, clearError };
};
