"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  getAccessToken,
  setAccessToken,
  getActiveBusinessId,
  setActiveBusinessId as setActiveBusinessIdLS,
  setSessionMarker,
} from "@/lib/api/accessToken";
import { refreshAccess, isTransientError } from "@/lib/api/refresh";
import { getMe, logout as logoutApi } from "@/services/authService";
import type { BusinessMembership, MeResponse } from "@/types";

const STALE_AFTER_MS = 5 * 60 * 1000;

interface AuthContextValue {
  me: MeResponse | null;
  isLoading: boolean;
  /**
   * True when bootstrap couldn't reach/verify the backend (network/5xx) — the
   * session is NOT necessarily over. Guards should show "something went wrong"
   * + Retry instead of redirecting to /login.
   */
  authError: boolean;
  retry: () => void;
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string | null) => void;
  activeMembership: BusinessMembership | null;
  login: (accessToken: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<MeResponse | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface StoredMe extends MeResponse {
  fetchedAt: number;
}

/**
 * Paths the password-change guard MUST NOT redirect away from.
 * /change-password is the destination; /login lets the escape-hatch
 * "Log out" round-trip cleanly.
 */
const CHANGE_PASSWORD_BYPASS = ["/change-password", "/login"];

// The legacy hard onboarding guard was replaced with a soft onboarding modal
// over the dashboard. Business_owners with no businesses now land on /app
// directly; the only guard left is the deep-link bounce off the legacy
// /onboarding/business URL — see the effect below.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState<StoredMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [activeBusinessIdState, setActiveBusinessIdState] = useState<
    string | null
  >(null);
  const bootstrappedRef = useRef(false);

  const updateActiveBusinessId = useCallback((id: string | null) => {
    setActiveBusinessIdLS(id);
    setActiveBusinessIdState(id);
  }, []);

  const fetchAndStoreMe = useCallback(async (): Promise<MeResponse> => {
    const fresh = await getMe();
    const stored: StoredMe = { ...fresh, fetchedAt: Date.now() };
    setMe(stored);
    if (fresh.businesses.length === 1) {
      const onlyId = fresh.businesses[0].id;
      const current = getActiveBusinessId();
      if (current !== onlyId) updateActiveBusinessId(onlyId);
    }
    return fresh;
  }, [updateActiveBusinessId]);

  const login = useCallback(
    async (accessToken: string): Promise<MeResponse> => {
      setAccessToken(accessToken);
      setSessionMarker(true);
      const fresh = await fetchAndStoreMe();
      return fresh;
    },
    [fetchAndStoreMe],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore — local state is the source of truth post-logout
    }
    setAccessToken(null);
    updateActiveBusinessId(null);
    setSessionMarker(false);
    setMe(null);
  }, [updateActiveBusinessId]);

  const refetchMe = useCallback(async (): Promise<MeResponse | null> => {
    try {
      return await fetchAndStoreMe();
    } catch {
      return null;
    }
  }, [fetchAndStoreMe]);

  // ─── Bootstrap ─────────────────────────────────────────────────────────
  // Restore the session from the refresh cookie, then load /auth/me. A
  // transient failure (backend down / 5xx) sets `authError` but KEEPS the
  // session — we don't log the user out over a server blip. Only a genuine
  // auth failure (refresh 401/403) clears the session.
  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setAuthError(false);
    try {
      await refreshAccess();
      const fresh = await getMe();
      const stored: StoredMe = { ...fresh, fetchedAt: Date.now() };
      setMe(stored);
      setSessionMarker(true);
      const lsId = getActiveBusinessId();
      if (lsId && fresh.businesses.some((b) => b.id === lsId)) {
        setActiveBusinessIdState(lsId);
      } else if (fresh.businesses.length >= 1) {
        updateActiveBusinessId(fresh.businesses[0].id);
      }
    } catch (err) {
      if (isTransientError(err)) {
        // Backend unreachable/broken — surface an error, keep the session.
        setAuthError(true);
      } else {
        // Genuinely logged out (expired/invalid refresh token).
        setAccessToken(null);
        setSessionMarker(false);
        setMe(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [updateActiveBusinessId]);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    void bootstrap();
  }, [bootstrap]);

  // ─── auth:unauthenticated → clear + redirect to /login ────────────────
  useEffect(() => {
    const onUnauth = () => {
      setAccessToken(null);
      updateActiveBusinessId(null);
      setSessionMarker(false);
      setMe(null);
      if (typeof window !== "undefined") {
        const onLogin = window.location.pathname.startsWith("/login");
        if (!onLogin) window.location.assign("/login");
      }
    };
    window.addEventListener("auth:unauthenticated", onUnauth);
    return () => window.removeEventListener("auth:unauthenticated", onUnauth);
  }, [updateActiveBusinessId]);

  // ─── auth:forbidden → toast + refetch (perms may have changed) ────────
  useEffect(() => {
    const onForbidden = (event: Event) => {
      const ce = event as CustomEvent<{ url: string; message: string }>;
      toast.error(
        ce.detail?.message ?? "You don't have permission to do this.",
      );
      void refetchMe();
    };
    window.addEventListener("auth:forbidden", onForbidden);
    return () => window.removeEventListener("auth:forbidden", onForbidden);
  }, [refetchMe]);

  // ─── Refetch /auth/me on focus when stale ─────────────────────────────
  useEffect(() => {
    const onFocus = () => {
      if (!me) return;
      if (Date.now() - me.fetchedAt < STALE_AFTER_MS) return;
      void refetchMe();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [me, refetchMe]);

  // ─── Password-change guard (Task 5) ────────────────────────────────────
  // If the user MUST change their password, bounce them to
  // /change-password from anywhere else. The page itself reads
  // passwordChangeRequired but doesn't self-redirect — once the
  // change-password handler updates `me` (passwordChangeRequired=false),
  // it routes onwards explicitly.
  useEffect(() => {
    if (!me) return;
    if (!me.user.passwordChangeRequired) return;
    if (!pathname) return;
    if (CHANGE_PASSWORD_BYPASS.some((p) => pathname.startsWith(p))) return;
    router.replace("/change-password");
  }, [me, pathname, router]);

  // ─── Onboarding redirect ───────────────────────────────────────────────
  // Business_owner without a business is now welcomed straight to /app —
  // the dashboard renders and shows an onboarding modal on top. We DO NOT
  // force them to /onboarding/business anymore; that route now only exists
  // as a legacy deep-link target that bounces them onwards.
  useEffect(() => {
    if (!me) return;
    if (me.user.passwordChangeRequired) return;
    if (me.user.systemRole !== "Business_owner") return;
    if (me.businesses.length > 0) return;
    if (!pathname) return;
    // Bounce off the legacy onboarding URL onto the dashboard.
    if (pathname === "/onboarding/business") {
      router.replace("/app");
    }
  }, [me, pathname, router]);

  const activeMembership = useMemo<BusinessMembership | null>(() => {
    if (!me) return null;
    const byId = activeBusinessIdState
      ? me.businesses.find((b) => b.id === activeBusinessIdState)
      : null;
    return byId ?? me.businesses[0] ?? null;
  }, [me, activeBusinessIdState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      me,
      isLoading,
      authError,
      retry: () => void bootstrap(),
      activeBusinessId: activeBusinessIdState,
      setActiveBusinessId: updateActiveBusinessId,
      activeMembership,
      login,
      logout,
      refetchMe,
    }),
    [
      me,
      isLoading,
      authError,
      bootstrap,
      activeBusinessIdState,
      updateActiveBusinessId,
      activeMembership,
      login,
      logout,
      refetchMe,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Hook helper for components that just need the access-token check. */
export function useIsAuthenticated(): boolean {
  return !!getAccessToken();
}
