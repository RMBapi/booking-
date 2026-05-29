import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "../AuthContext";
import type { MeResponse } from "@/types";

const refreshAccessMock = vi.fn();
const getMeMock = vi.fn();
const logoutApiMock = vi.fn();

vi.mock("@/lib/api/refresh", () => ({
  refreshAccess: () => refreshAccessMock(),
}));

vi.mock("@/services/authService", () => ({
  getMe: () => getMeMock(),
  logout: () => logoutApiMock(),
}));

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/app",
}));

const me: MeResponse = {
  user: {
    id: "u-1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "555",
    systemRole: "Business_owner",
    createdAt: new Date().toISOString(),
    passwordChangeRequired: false,
  },
  businesses: [
    {
      id: "biz-1",
      name: "Acme",
      slug: "acme",
      logo: null,
      role: "Business_owner",
      status: "Active",
      permissions: ["view_dashboard"],
    },
  ],
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  refreshAccessMock.mockReset();
  getMeMock.mockReset();
  logoutApiMock.mockReset();
  replaceMock.mockReset();
  window.localStorage.clear();
  // jsdom: cookies start empty per-test (jsdom keeps document.cookie scoped to window).
  document.cookie = "has_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

describe("AuthContext", () => {
  it("login fetches /auth/me and sets state", async () => {
    refreshAccessMock.mockRejectedValue(new Error("no cookie"));
    getMeMock.mockResolvedValueOnce(me);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for bootstrap to settle (no session)
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.me).toBeNull();

    await act(async () => {
      await result.current.login("token-1");
    });

    expect(result.current.me?.user.email).toBe("ada@example.com");
    expect(result.current.activeMembership?.id).toBe("biz-1");
    expect(window.localStorage.getItem("activeBusinessId")).toBe("biz-1");
    expect(document.cookie).toContain("has_session=1");
  });

  it("activeBusinessId persists in localStorage", async () => {
    refreshAccessMock.mockRejectedValue(new Error("no cookie"));
    const meTwo: MeResponse = {
      ...me,
      businesses: [
        ...me.businesses,
        {
          id: "biz-2",
          name: "Beta",
          slug: "beta",
          logo: null,
          role: "Service_Provider",
          status: "Active",
          permissions: [],
        },
      ],
    };
    getMeMock.mockResolvedValue(meTwo);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("token-1");
    });

    act(() => {
      result.current.setActiveBusinessId("biz-2");
    });
    expect(window.localStorage.getItem("activeBusinessId")).toBe("biz-2");
    expect(result.current.activeMembership?.id).toBe("biz-2");
  });

  it("logout clears token, me, activeBusinessId, and has_session cookie", async () => {
    refreshAccessMock.mockRejectedValue(new Error("no cookie"));
    getMeMock.mockResolvedValueOnce(me);
    logoutApiMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("token-1");
    });
    expect(result.current.me).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.me).toBeNull();
    expect(result.current.activeBusinessId).toBeNull();
    expect(window.localStorage.getItem("activeBusinessId")).toBeNull();
    expect(document.cookie.includes("has_session=1")).toBe(false);
  });

  it("refetchMe updates state without going through login flow", async () => {
    refreshAccessMock.mockRejectedValue(new Error("no cookie"));
    const updated: MeResponse = {
      ...me,
      businesses: [
        {
          ...me.businesses[0],
          permissions: ["view_dashboard", "manage_team"],
        },
      ],
    };
    getMeMock.mockResolvedValueOnce(me).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("token-1");
    });
    expect(result.current.me?.businesses[0].permissions).toEqual(["view_dashboard"]);

    await act(async () => {
      await result.current.refetchMe();
    });
    expect(result.current.me?.businesses[0].permissions).toContain("manage_team");
  });
});
