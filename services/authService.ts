import { http } from "@/lib";
import { LoginPayload, RegisterPayload } from "@/types";

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
  // Clear local storage
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};
