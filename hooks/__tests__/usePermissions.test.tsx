import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../usePermissions";
import type { BusinessMembership, MeResponse } from "@/types";

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock("@/contexts", () => ({
  useAuth: () => mockUseAuth(),
}));

function makeMembership(
  partial: Partial<BusinessMembership> = {},
): BusinessMembership {
  return {
    id: "biz-1",
    name: "Acme",
    slug: "acme",
    logo: null,
    role: "Service_Provider",
    status: "Active",
    permissions: [],
    ...partial,
  };
}

function makeMe(
  systemRole: MeResponse["user"]["systemRole"],
  membership: BusinessMembership | null,
): { me: MeResponse; activeMembership: BusinessMembership | null } {
  const me: MeResponse = {
    user: {
      id: "u-1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "555",
      systemRole,
      createdAt: new Date().toISOString(),
      passwordChangeRequired: false,
    },
    businesses: membership ? [membership] : [],
  };
  return { me, activeMembership: membership };
}

beforeEach(() => {
  mockUseAuth.mockReset();
});

describe("usePermissions", () => {
  it("Super_Admin grants every feature regardless of membership", () => {
    mockUseAuth.mockReturnValue(makeMe("Super_Admin", null));
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.hasFeature("manage_team")).toBe(true);
    expect(result.current.hasFeature("view_analytics")).toBe(true);
    expect(result.current.hasAllFeatures(["manage_bookings", "view_settings"])).toBe(true);
  });

  it("Business_owner with full permissions array passes every check", () => {
    const all = [
      "view_dashboard",
      "view_analytics",
      "view_bookings",
      "manage_bookings",
      "view_services",
      "manage_services",
      "view_contacts",
      "manage_contacts",
      "view_providers",
      "manage_providers",
      "view_calendar",
      "view_settings",
      "manage_team",
      "manage_business",
    ];
    mockUseAuth.mockReturnValue(
      makeMe(
        "Business_owner",
        makeMembership({ role: "Business_owner", permissions: all }),
      ),
    );
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isBusinessOwner).toBe(true);
    expect(result.current.hasFeature("manage_team")).toBe(true);
    expect(result.current.hasAllFeatures(["view_bookings", "manage_business"])).toBe(true);
  });

  it("Service_Provider with view_bookings only", () => {
    mockUseAuth.mockReturnValue(
      makeMe(
        "Service_Provider",
        makeMembership({ role: "Service_Provider", permissions: ["view_bookings"] }),
      ),
    );
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasFeature("view_bookings")).toBe(true);
    expect(result.current.hasFeature("manage_bookings")).toBe(false);
    expect(result.current.hasAnyFeature(["manage_team", "view_bookings"])).toBe(true);
    expect(result.current.hasAllFeatures(["view_bookings", "manage_bookings"])).toBe(false);
    expect(result.current.isBusinessOwner).toBe(false);
  });

  it("returns false for everything when there is no active membership", () => {
    mockUseAuth.mockReturnValue({ me: null, activeMembership: null });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasFeature("view_bookings")).toBe(false);
    expect(result.current.hasAllFeatures(["view_bookings"])).toBe(false);
    expect(result.current.hasAnyFeature(["view_bookings"])).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isBusinessOwner).toBe(false);
  });
});
