import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "../AuthContext";
import type { MeResponse } from "@/types";

const refreshAccessMock = vi.fn();
const getMeMock = vi.fn();
const replaceMock = vi.fn();
let pathnameStub = "/app";

vi.mock("@/lib/api/refresh", () => ({
  refreshAccess: () => refreshAccessMock(),
}));

vi.mock("@/services/authService", () => ({
  getMe: () => getMeMock(),
  logout: () => Promise.resolve(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => pathnameStub,
}));

function buildMe(overrides?: {
  passwordChangeRequired?: boolean;
  systemRole?: MeResponse["user"]["systemRole"];
  businesses?: MeResponse["businesses"];
}): MeResponse {
  return {
    user: {
      id: "u-1",
      firstName: "Ada",
      lastName: "L",
      email: "a@a.co",
      phone: "555",
      systemRole: overrides?.systemRole ?? "Business_owner",
      createdAt: "2026-01-01",
      passwordChangeRequired: overrides?.passwordChangeRequired ?? false,
    },
    businesses: overrides?.businesses ?? [],
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  refreshAccessMock.mockReset();
  getMeMock.mockReset();
  replaceMock.mockReset();
  pathnameStub = "/app";
  window.localStorage.clear();
});

describe("AuthContext route guards", () => {
  it("passwordChangeRequired=true on /app → redirects to /change-password", async () => {
    refreshAccessMock.mockResolvedValue("tok");
    getMeMock.mockResolvedValue(
      buildMe({ passwordChangeRequired: true }),
    );
    pathnameStub = "/app";

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/change-password"),
    );
  });

  it("Business_owner with empty businesses on /app → does NOT redirect (onboarding modal handles it)", async () => {
    refreshAccessMock.mockResolvedValue("tok");
    getMeMock.mockResolvedValue(buildMe({ businesses: [] }));
    pathnameStub = "/app";

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await new Promise((r) => setTimeout(r, 10));
    // The legacy hard redirect to /onboarding/business is gone — the
    // dashboard now renders an onboarding modal in its place.
    expect(
      replaceMock.mock.calls.some((c) => c[0] === "/onboarding/business"),
    ).toBe(false);
  });

  it("/change-password page does not redirect itself", async () => {
    refreshAccessMock.mockResolvedValue("tok");
    getMeMock.mockResolvedValue(
      buildMe({ passwordChangeRequired: true }),
    );
    pathnameStub = "/change-password";

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // give effects a microtask to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(
      replaceMock.mock.calls.some((c) => c[0] === "/change-password"),
    ).toBe(false);
  });

  it("Business_owner deep-linking /onboarding/business → bounced to /app", async () => {
    refreshAccessMock.mockResolvedValue("tok");
    getMeMock.mockResolvedValue(buildMe({ businesses: [] }));
    pathnameStub = "/onboarding/business";

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/app"),
    );
  });

  it("Service_Provider with empty businesses on /app → does NOT redirect to onboarding", async () => {
    refreshAccessMock.mockResolvedValue("tok");
    getMeMock.mockResolvedValue(
      buildMe({ systemRole: "Service_Provider", businesses: [] }),
    );
    pathnameStub = "/app";

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await new Promise((r) => setTimeout(r, 10));
    expect(
      replaceMock.mock.calls.some((c) => c[0] === "/onboarding/business"),
    ).toBe(false);
  });

  it("Customer with empty businesses on /app → does NOT redirect to onboarding", async () => {
    refreshAccessMock.mockResolvedValue("tok");
    getMeMock.mockResolvedValue(
      buildMe({ systemRole: "Customer", businesses: [] }),
    );
    pathnameStub = "/app";

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await new Promise((r) => setTimeout(r, 10));
    expect(
      replaceMock.mock.calls.some((c) => c[0] === "/onboarding/business"),
    ).toBe(false);
  });
});
