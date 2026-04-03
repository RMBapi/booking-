import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { register as registerApi, getProfile } from "@/services";
import { useApiResponse } from "@/hooks";
import { useRoleAuth } from "@/contexts";
import { AuthResponse, RegisterPayload, User } from "@/types";
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
      const accessToken = response.data?.accessToken;
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

      setSession(registrationRole, accessToken, user, additionalData);
      handleSuccess("Registration successful!");

      const returnUrl = searchParams?.get("returnUrl");
      const redirectPath = returnUrl || getRoleRedirectPath(registrationRole);

      setTimeout(() => {
        router.replace(redirectPath);
      }, 100);
    },
    onError: handleError,
  });

  return { register, isRegistering };
};
