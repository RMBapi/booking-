import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ChangePasswordPage from "../page";

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
  usePathname: () => "/change-password",
}));

const useAuthMock = vi.fn();
vi.mock("@/contexts", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const changePasswordMock = vi.fn();
vi.mock("@/services/authService", () => ({
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
}));

const setAccessTokenMock = vi.fn();
vi.mock("@/lib/api/accessToken", () => ({
  setAccessToken: (t: string | null) => setAccessTokenMock(t),
}));

beforeEach(() => {
  replaceMock.mockReset();
  changePasswordMock.mockReset();
  setAccessTokenMock.mockReset();
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue({
    me: {
      user: {
        id: "u-1",
        firstName: "Ada",
        lastName: "L",
        email: "a@a.co",
        phone: "1",
        systemRole: "Business_owner",
        createdAt: "2026-01-01",
        passwordChangeRequired: true,
      },
      businesses: [],
    },
    logout: vi.fn(),
    refetchMe: vi.fn().mockResolvedValue({
      user: {
        id: "u-1",
        firstName: "Ada",
        lastName: "L",
        email: "a@a.co",
        phone: "1",
        systemRole: "Business_owner",
        createdAt: "2026-01-01",
        passwordChangeRequired: false,
      },
      businesses: [],
    }),
  });
});

function fillAndSubmit({
  current,
  next,
  confirm,
}: {
  current: string;
  next: string;
  confirm: string;
}) {
  fireEvent.change(screen.getByLabelText(/current password/i), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText(/^new password/i), {
    target: { value: next },
  });
  fireEvent.change(screen.getByLabelText(/confirm new password/i), {
    target: { value: confirm },
  });
  fireEvent.click(screen.getByRole("button", { name: /update password/i }));
}

describe("/change-password page", () => {
  it("renders form with three password fields and submit button", () => {
    render(<ChangePasswordPage />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeInTheDocument();
  });

  it("submits with the right body and redirects Business_owner with no businesses to /app (onboarding modal mounts there)", async () => {
    changePasswordMock.mockResolvedValue({
      accessToken: "tok-2",
      user: {
        id: "u-1",
        firstName: "Ada",
        lastName: "L",
        email: "a@a.co",
        phone: "1",
        systemRole: "Business_owner",
        createdAt: "2026-01-01",
        passwordChangeRequired: false,
      },
    });

    render(<ChangePasswordPage />);
    fillAndSubmit({
      current: "OldPass1",
      next: "NewPass2025",
      confirm: "NewPass2025",
    });

    await waitFor(() => expect(changePasswordMock).toHaveBeenCalledTimes(1));
    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: "OldPass1",
      newPassword: "NewPass2025",
      confirmPassword: "NewPass2025",
    });
    await waitFor(() => expect(setAccessTokenMock).toHaveBeenCalledWith("tok-2"));
    // postLoginPath returns "/app" when systemRole=Business_owner and businesses=[]
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/app"),
    );
  });

  it("401 → inline error on currentPassword", async () => {
    changePasswordMock.mockRejectedValue({ response: { status: 401 } });
    render(<ChangePasswordPage />);
    fillAndSubmit({
      current: "wrong",
      next: "NewPass2025",
      confirm: "NewPass2025",
    });

    await waitFor(() =>
      expect(
        screen.getByText("Current password is incorrect"),
      ).toBeInTheDocument(),
    );
  });

  it("429 → top banner with wait copy", async () => {
    changePasswordMock.mockRejectedValue({ response: { status: 429 } });
    render(<ChangePasswordPage />);
    fillAndSubmit({
      current: "Old",
      next: "NewPass2025",
      confirm: "NewPass2025",
    });

    await waitFor(() =>
      expect(
        screen.getByText(/too many attempts/i),
      ).toBeInTheDocument(),
    );
  });

  it("on success: routes to postLoginPath when businesses are populated", async () => {
    useAuthMock.mockReturnValue({
      me: {
        user: {
          id: "u-1",
          firstName: "Ada",
          lastName: "L",
          email: "a@a.co",
          phone: "1",
          systemRole: "Business_owner",
          createdAt: "2026-01-01",
          passwordChangeRequired: true,
        },
        businesses: [],
      },
      logout: vi.fn(),
      refetchMe: vi.fn().mockResolvedValue({
        user: {
          id: "u-1",
          firstName: "Ada",
          lastName: "L",
          email: "a@a.co",
          phone: "1",
          systemRole: "Business_owner",
          createdAt: "2026-01-01",
          passwordChangeRequired: false,
        },
        businesses: [
          { id: "biz-1", name: "Acme", slug: "acme", logo: null, role: "Business_owner", permissions: [] },
        ],
      }),
    });
    changePasswordMock.mockResolvedValue({
      accessToken: "tok-2",
      user: { passwordChangeRequired: false },
    });

    render(<ChangePasswordPage />);
    fillAndSubmit({
      current: "OldPass",
      next: "NewPass2025",
      confirm: "NewPass2025",
    });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app/biz-1"));
  });
});
