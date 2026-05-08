import { http } from "@/lib";
import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthResponse,
  ChangePasswordDto,
  ChangePasswordResponse,
  MeResponse,
} from "@/types";

const unwrapAuth = (data: unknown): AuthResponse => {
  const wrapped = data as { data?: AuthResponse } & AuthResponse;
  return wrapped?.data ?? wrapped;
};

export const login = async (
  payload: AuthLoginPayload,
): Promise<AuthResponse> => {
  const res = await http.post("/auth/login", payload);
  return unwrapAuth(res.data);
};

export const register = async (
  payload: AuthRegisterPayload,
): Promise<AuthResponse> => {
  const res = await http.post("/auth/register", payload);
  return unwrapAuth(res.data);
};

/**
 * Canonical "who am I". Single source of truth for user + memberships +
 * permissions. Wrapped envelope { success, data } is unwrapped here.
 */
export const getMe = async (): Promise<MeResponse> => {
  const res = await http.get("/auth/me");
  return res.data?.data ?? res.data;
};

/**
 * POST /auth/change-password — used by the forced-change flow on first
 * login (and by future "I want to change my password" flows). The
 * backend rotates cb_rt automatically. Caller MUST swap the in-memory
 * access token to the returned `accessToken` and refetch /auth/me.
 *
 * Errors:
 *   401  current password wrong
 *   400  mismatch / new equals current
 *   429  rate limit exceeded (5/min)
 */
export const changePassword = async (
  dto: ChangePasswordDto,
): Promise<ChangePasswordResponse> => {
  const res = await http.post("/auth/change-password", dto);
  const body = res.data?.data ?? res.data;
  return body as ChangePasswordResponse;
};

/**
 * Idempotent — backend returns 204 even with no cookie. Caller clears
 * local state.
 */
export const logout = async (): Promise<void> => {
  try {
    await http.post("/auth/logout");
  } catch {
    // non-fatal — local clear is the source of truth
  }
};
