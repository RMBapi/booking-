import { http } from "@/lib";
import { LoginPayload, RegisterPayload } from "@/types";
import { clearRoleSession } from "@/lib/roleBasedAuth";

/**
 * Authentication Service
 */

export const login = async (payload: LoginPayload) => {
  return http.post("/auth/login", payload);
};

export const register = async (payload: RegisterPayload) => {
  return http.post("/auth/register", payload);
};

export const getProfile = async () => {
  return http.get("/user/me");
};

export const logout = async () => {
  clearRoleSession("Customer");
};
