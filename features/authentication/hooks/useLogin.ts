import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { login as loginApi } from "@/services";
import { useApiResponse } from "@/hooks";
import { useRoleAuth } from "@/contexts";
import { AuthResponse, LoginPayload, UserRole } from "@/types";
import { getRoleRedirectPath } from "@/lib";

type MutationResponse = AxiosResponse<AuthResponse>;

export const useLogin = () => {
  const { handleSuccess, handleError } = useApiResponse();
  const { setSession } = useRoleAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isPending: isLogging, mutate: login } = useMutation<
    MutationResponse,
    Error,
    LoginPayload
  >({
    mutationFn: loginApi,
    onSuccess: (response, variables) => {
      // Debug: log the response structure
      if (process.env.NODE_ENV === "development") {
        console.log("=== LOGIN RESPONSE DEBUG ===");
        console.log("Login response:", response);
        console.log("Response data:", response.data);
        console.log("Login role:", variables.role);
      }
      
      const { accessToken, user } = response.data || {};
      
      if (!user || !accessToken) {
        console.error("Invalid response structure:", response.data);
        handleError(new Error("Invalid response: missing user or token"));
        return;
      }
      
      // Use the role from the login request
      const loginRole = variables.role;
      
      // Debug: log the role being used for session storage
      if (process.env.NODE_ENV === "development") {
        console.log("Storing session for role:", loginRole);
      }
      
      // Store session for this specific role
      const additionalData: Record<string, string> = {};
      
      // For customer logins, store businessSiteSlug
      if (loginRole === "Customer" && variables.businessSiteSlug) {
        additionalData.businessSiteSlug = variables.businessSiteSlug;
      }
      
      setSession(loginRole, accessToken, user, additionalData);
      
      handleSuccess(`Login successful as ${loginRole.replace("_", " ")}!`);
      
      // Check for returnUrl in query params, otherwise use default redirect path
      const returnUrl = searchParams?.get("returnUrl");
      const redirectPath = returnUrl || getRoleRedirectPath(loginRole);
      
      if (process.env.NODE_ENV === "development") {
        console.log("Redirecting to:", redirectPath);
      }
      
      // Use replace to avoid adding to history
      router.replace(redirectPath);
    },
    onError: handleError,
  });

  return { login, isLogging };
};
