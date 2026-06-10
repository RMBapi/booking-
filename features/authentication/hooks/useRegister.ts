import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { register as registerApi, getProfile } from "@/services";
import { useApiResponse } from "@/hooks";
import { useRoleAuth } from "@/contexts";
import { AuthResponse, RegisterPayload, User } from "@/types";
import { getRoleRedirectPath, saveRoleSession } from "@/lib";
import { extractApiErrorMessage } from "@/hooks/api-response";

type MutationResponse = AxiosResponse<AuthResponse>;

export const useRegister = () => {
  const { handleSuccess, handleError } = useApiResponse();
  const { setSession } = useRoleAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );

  const { isPending: isRegistering, mutate: register } = useMutation<
    MutationResponse,
    Error,
    RegisterPayload
  >({
    mutationFn: registerApi,
    onSuccess: async (response, variables) => {
      const accessToken = response.data?.accessToken;
      const businessId = response.data?.businessId;
      let user = response.data?.user;

      if (accessToken && (!user || Object.keys(user).length === 0)) {
        try {
          saveRoleSession(variables.role, accessToken, {} as User);
          const profileResponse = await getProfile();

          if (profileResponse.data?.success) {
            user = profileResponse.data.data;
          } else {
            handleError(
              new Error(
                "Registration successful but failed to load user profile. Please try logging in.",
              ),
            );
            return;
          }
        } catch {
          handleError(
            new Error(
              "Registration successful but failed to load user profile. Please try logging in.",
            ),
          );
          return;
        }
      }

      if (!user || !accessToken) {
        handleError(new Error("Invalid response: missing user or token."));
        return;
      }

      const userRoles = user.roles || (user.role ? [user.role] : []);
      const registrationRole = variables.role;

      if (userRoles.length === 0) {
        user = {
          ...user,
          role: registrationRole,
          roles: [registrationRole],
          activeRole: registrationRole,
        };
      }

      const additionalData: Record<string, string> = {};
      if (registrationRole === "Customer" && variables.businessSiteSlug) {
        additionalData.businessSiteSlug = variables.businessSiteSlug;
      }
      if (businessId) {
        additionalData.businessId = businessId;
      }

      setSession(registrationRole, accessToken, user, additionalData);
      handleSuccess("Registration successful!");

      const returnUrl = searchParams?.get("returnUrl");
      const redirectPath = returnUrl || getRoleRedirectPath(registrationRole);

      setTimeout(() => {
        router.replace(redirectPath);
      }, 100);
    },
    onError: (error: Error) => {
      const parsedMessage = extractApiErrorMessage(error);
      const normalizedMessage = parsedMessage.toLowerCase();

      if (normalizedMessage.includes("already registered")) {
        // User already registered with this business — redirect to login
        const businessSiteSlug = searchParams?.get("businessSiteSlug");
        setRegistrationError(
          "You are already registered with this business. Redirecting to login...",
        );
        setTimeout(() => {
          const loginUrl = businessSiteSlug
            ? `/auth/login/customer?businessSiteSlug=${encodeURIComponent(
                businessSiteSlug,
              )}`
            : "/auth/login/customer";
          router.replace(loginUrl);
        }, 1500);
      } else {
        setRegistrationError(null);
        handleError(error);
      }
    },
  });

  const clearError = () => setRegistrationError(null);

  return { register, isRegistering, registrationError, clearError };
};
