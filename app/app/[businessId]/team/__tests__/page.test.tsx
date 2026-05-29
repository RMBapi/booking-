import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import TeamPage from "../page";
import type { TeamMember, AvailableFeature } from "@/types";

const useAuthMock = vi.fn();
const useTeamMock = vi.fn();
const useFeaturesMock = vi.fn();
const addMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const removeMutateAsync = vi.fn();

vi.mock("@/contexts", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ businessId: "biz-1" }),
}));

vi.mock("@/features/team/hooks", () => ({
  useTeam: () => useTeamMock(),
  useAvailableFeatures: () => useFeaturesMock(),
  useAddTeamMember: () => ({
    mutateAsync: addMutateAsync,
    isPending: false,
  }),
  useUpdateTeamMember: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
  useRemoveTeamMember: () => ({
    mutateAsync: removeMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    isSuperAdmin: false,
    permissions: ["manage_team"],
    hasFeature: (c: string) => ["manage_team"].includes(c),
    hasAllFeatures: (codes: string[]) =>
      codes.every((c) => ["manage_team"].includes(c)),
    hasAnyFeature: (codes: string[]) =>
      codes.some((c) => ["manage_team"].includes(c)),
  }),
}));

const owner: TeamMember = {
  userId: "u-owner",
  firstName: "Olive",
  lastName: "Owner",
  email: "olive@example.com",
  phone: "555",
  role: "Business_owner",
  permissions: Array(14).fill("x"),
  status: "Active",
  joinedAt: new Date().toISOString(),
};
const provider: TeamMember = {
  userId: "u-prov",
  firstName: "Sam",
  lastName: "Provider",
  email: "sam@example.com",
  phone: "555",
  role: "Service_Provider",
  permissions: ["view_bookings", "view_calendar", "view_services"],
  status: "Pending",
  joinedAt: new Date().toISOString(),
};

const features: AvailableFeature[] = [
  { code: "view_bookings", label: "View bookings", description: "See bookings" },
  { code: "manage_bookings", label: "Manage bookings", description: "Edit bookings" },
];

function withQueryClient(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

beforeEach(() => {
  useAuthMock.mockReset();
  useTeamMock.mockReset();
  useFeaturesMock.mockReset();
  addMutateAsync.mockReset();
  updateMutateAsync.mockReset();
  removeMutateAsync.mockReset();

  useFeaturesMock.mockReturnValue({ data: features });
});

describe("Team page", () => {
  it("renders members with role chips and a Pending badge for inactive members", () => {
    useAuthMock.mockReturnValue({
      me: { user: { id: "u-owner" } },
      activeMembership: {
        id: "biz-1",
        name: "Acme",
        role: "Business_owner",
      },
    });
    useTeamMock.mockReturnValue({ data: [owner, provider], isLoading: false });
    render(withQueryClient(<TeamPage />));

    expect(screen.getByText("Olive Owner")).toBeInTheDocument();
    expect(screen.getByText("Sam Provider")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Business owner")).toBeInTheDocument();
    expect(screen.getByText("Service Provider")).toBeInTheDocument();
    expect(screen.getByText("3 of 14")).toBeInTheDocument();
  });

  it("disables Remove for self with explanatory tooltip", () => {
    useAuthMock.mockReturnValue({
      me: { user: { id: "u-owner" } },
      activeMembership: {
        id: "biz-1",
        name: "Acme",
        role: "Business_owner",
      },
    });
    useTeamMock.mockReturnValue({ data: [owner, provider], isLoading: false });
    render(withQueryClient(<TeamPage />));

    // Open the owner row's overflow menu (trigger has aria-label "Actions for {firstName}")
    fireEvent.click(screen.getByRole("button", { name: /Actions for Olive/i }));

    const selfRemove = screen.getByRole("menuitem", { name: /Remove/i }) as HTMLButtonElement;
    expect(selfRemove).toBeDisabled();
    expect(selfRemove.getAttribute("title")).toMatch(/another owner/i);
  });

  it("disables Remove on the last business owner", () => {
    useAuthMock.mockReturnValue({
      me: { user: { id: "someone-else" } },
      activeMembership: {
        id: "biz-1",
        name: "Acme",
        role: "Business_owner",
      },
    });
    useTeamMock.mockReturnValue({ data: [owner], isLoading: false });
    render(withQueryClient(<TeamPage />));

    fireEvent.click(screen.getByRole("button", { name: /Actions for Olive/i }));

    const remove = screen.getByRole("menuitem", { name: /Remove/i }) as HTMLButtonElement;
    expect(remove).toBeDisabled();
    expect(remove.getAttribute("title")).toMatch(/last business owner/i);
  });

  it("Add Member modal restricts role cards for Service_Provider callers", async () => {
    useAuthMock.mockReturnValue({
      me: { user: { id: "u-prov" } },
      activeMembership: {
        id: "biz-1",
        name: "Acme",
        role: "Service_Provider",
      },
    });
    useTeamMock.mockReturnValue({ data: [owner, provider], isLoading: false });
    render(withQueryClient(<TeamPage />));

    fireEvent.click(screen.getByText("Add member"));

    // Step 1 — fill required details and continue to permissions step
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Pat" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Q" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "pat@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "555" },
    });
    fireEvent.change(screen.getByLabelText(/temporary password/i), {
      target: { value: "supersecret" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to permissions/i }),
    );

    // Step 2 — Service_Provider caller can pick Service Provider only.
    expect(
      await screen.findByRole("button", { name: /service provider/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /business owner/i }),
    ).not.toBeInTheDocument();
  });
});
