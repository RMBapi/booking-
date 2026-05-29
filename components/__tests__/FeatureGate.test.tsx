import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureGate } from "../auth/FeatureGate";

const mockUsePermissions = vi.fn();
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

beforeEach(() => mockUsePermissions.mockReset());

function setPerms(perms: string[], isSuper = false) {
  mockUsePermissions.mockReturnValue({
    permissions: perms,
    isSuperAdmin: isSuper,
    hasFeature: (c: string) => isSuper || perms.includes(c),
    hasAllFeatures: (codes: string[]) =>
      isSuper || codes.every((c) => perms.includes(c)),
    hasAnyFeature: (codes: string[]) =>
      isSuper || codes.some((c) => perms.includes(c)),
  });
}

describe("FeatureGate", () => {
  it("renders children when feature is granted", () => {
    setPerms(["view_bookings"]);
    render(
      <FeatureGate feature="view_bookings">
        <span>visible</span>
      </FeatureGate>,
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders fallback when feature is missing", () => {
    setPerms([]);
    render(
      <FeatureGate
        feature="manage_team"
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </FeatureGate>,
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
    expect(screen.queryByText("visible")).not.toBeInTheDocument();
  });

  it("'all' mode requires every feature", () => {
    setPerms(["view_bookings"]);
    render(
      <FeatureGate
        feature={["view_bookings", "manage_bookings"]}
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </FeatureGate>,
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
  });

  it("'any' mode requires at least one feature", () => {
    setPerms(["view_bookings"]);
    render(
      <FeatureGate
        feature={["view_bookings", "manage_bookings"]}
        mode="any"
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </FeatureGate>,
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders unconditionally when no feature prop is given", () => {
    setPerms([]);
    render(
      <FeatureGate>
        <span>visible</span>
      </FeatureGate>,
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });
});
