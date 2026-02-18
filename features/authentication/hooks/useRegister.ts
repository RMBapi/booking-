import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { register as registerApi, getProfile } from "@/services";
import { useApiResponse } from "@/hooks";
import { useRoleAuth } from "@/contexts";
import { AuthResponse, RegisterPayload, User, UserRole } from "@/types";
import { getRoleRedirectPath, saveRoleSession } from "@/lib";

type MutationResponse = AxiosResponse<AuthResponse>;

export const useRegister = () => {
  const { handleSuccess, handleError } = useApiResponse();
  const { setSession } = useRoleAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isPending: isRegistering, mutate: register } = useMutation<
    MutationResponse,
    Error,
    RegisterPayload
  >({
    mutationFn: registerApi,
    onSuccess: async (response, variables) => {
      // Debug: log the response structure
      console.log("=== REGISTRATION RESPONSE DEBUG ===");
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      console.log("Response status:", response.status);
      console.log("Registration payload sent:", variables);
      
      let { accessToken, user } = response.data || {};
      
      console.log("Extracted accessToken:", accessToken);
      console.log("Extracted user:", user);
      console.log("User type:", typeof user);
      console.log("User keys:", user ? Object.keys(user) : "N/A");
      
      // If user object is empty or missing, but we have a token, fetch the user profile
      if (accessToken && (!user || Object.keys(user).length === 0)) {
        console.warn("⚠️ User object is empty/missing in registration response. Fetching user profile...");
        
        try {
          // Temporarily save the token so the profile request can be authenticated
          saveRoleSession(variables.role, accessToken, {} as User);
          
          // Fetch the user profile
          const profileResponse = await getProfile();
          console.log("Profile fetch response:", profileResponse);
          
          if (profileResponse.data && profileResponse.data.success) {
            user = profileResponse.data.data;
            console.log("✅ Successfully fetched user profile:", user);
          } else {
            console.error("❌ Failed to fetch user profile:", profileResponse);
            handleError(new Error("Registration successful but failed to load user profile. Please try logging in."));
            return;
          }
        } catch (profileError) {
          console.error("❌ Error fetching user profile after registration:", profileError);
          handleError(new Error("Registration successful but failed to load user profile. Please try logging in."));
          return;
        }
      }
      
      if (!user || !accessToken) {
        console.error("Invalid response structure:", response.data);
        handleError(new Error("Invalid response: missing user or token. Check backend /auth/register endpoint"));
        return;
      }
      
      // Check if user has roles array (new format) or role (old format)
      const userRoles = user.roles || (user.role ? [user.role] : []);
      
      console.log("Extracted roles:", userRoles);
      console.log("user.roles:", user.roles);
      console.log("user.role:", user.role);
      
      if (userRoles.length === 0) {
        console.error("User object missing roles:", user);
        console.error("Expected user to have 'roles' array or 'role' property");
        handleError(new Error("Invalid user object: missing roles. Backend should return user with roles property"));
        return;
      }
      
      // Use the role from the registration request
      const registrationRole = variables.role;
      
      // Store session for this specific role
      const additionalData: Record<string, string> = {};
      
      // For customer registrations, store businessSiteSlug
      if (registrationRole === "Customer" && variables.businessSiteSlug) {
        additionalData.businessSiteSlug = variables.businessSiteSlug;
      }
      
      setSession(registrationRole, accessToken, user, additionalData);
      
      handleSuccess(`Registration successful as ${registrationRole.replace("_", " ")}!`);
      
      // Check for returnUrl in query params, otherwise use default redirect path
      const returnUrl = searchParams?.get("returnUrl");
      const redirectPath = returnUrl || getRoleRedirectPath(registrationRole);
      
      // Use Next.js router instead of window.location.href for consistency
      setTimeout(() => {
        router.replace(redirectPath);
      }, 100);
    },
    onError: handleError,
  });

  return { register, isRegistering };
};
