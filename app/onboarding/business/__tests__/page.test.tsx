import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import OnboardBusinessPage from "../page";

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
  usePathname: () => "/onboarding/business",
}));

const useAuthMock = vi.fn();
vi.mock("@/contexts", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const onboardMock = vi.fn();
vi.mock("@/services/businessService", () => ({
  onboardBusiness: (...args: unknown[]) => onboardMock(...args),
}));

const refetchMeMock = vi.fn();
const setActiveBusinessIdMock = vi.fn();
const logoutMock = vi.fn();

beforeEach(() => {
  replaceMock.mockReset();
  onboardMock.mockReset();
  refetchMeMock.mockReset();
  setActiveBusinessIdMock.mockReset();
  logoutMock.mockReset();

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
        passwordChangeRequired: false,
      },
      businesses: [],
    },
    refetchMe: refetchMeMock,
    setActiveBusinessId: setActiveBusinessIdMock,
    logout: logoutMock,
  });
});

describe("/onboarding/business page", () => {
  it("auto-generates slug from business name", () => {
    render(<OnboardBusinessPage />);
    const nameInput = screen.getByLabelText(/business name/i);
    const slugInput = screen.getByLabelText(/url slug/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Acme Salon!" } });
    expect(slugInput.value).toBe("acme-salon");
  });

  it("stops auto-generating slug once user manually edits it", () => {
    render(<OnboardBusinessPage />);
    const nameInput = screen.getByLabelText(/business name/i);
    const slugInput = screen.getByLabelText(/url slug/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Acme Salon" } });
    expect(slugInput.value).toBe("acme-salon");

    fireEvent.change(slugInput, { target: { value: "acme-nyc" } });
    expect(slugInput.value).toBe("acme-nyc");

    // Further changes to name should NOT overwrite the manually-edited slug
    fireEvent.change(nameInput, { target: { value: "Acme Salon LA" } });
    expect(slugInput.value).toBe("acme-nyc");
  });

  it("submits with the right body and routes to /app/{newId} on success", async () => {
    onboardMock.mockResolvedValue({ id: "biz-99", name: "Acme", slug: "acme" });
    refetchMeMock.mockResolvedValue({
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
        { id: "biz-99", name: "Acme", slug: "acme", logo: null, role: "Business_owner", permissions: [] },
      ],
    });

    render(<OnboardBusinessPage />);
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Acme Salon" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create my business/i }));

    await waitFor(() => expect(onboardMock).toHaveBeenCalledTimes(1));
    expect(onboardMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Acme Salon", slug: "acme-salon" }),
    );
    await waitFor(() =>
      expect(setActiveBusinessIdMock).toHaveBeenCalledWith("biz-99"),
    );
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app/biz-99"));
  });

  it("409 with slug message → inline error on slug field", async () => {
    onboardMock.mockRejectedValue({
      response: { status: 409, data: { message: "Slug already in use" } },
    });

    render(<OnboardBusinessPage />);
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create my business/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/this url is already taken/i),
      ).toBeInTheDocument(),
    );
  });

  it("409 with 'already have a business' → refetch + redirect to /app/{id}", async () => {
    onboardMock.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "User already have a business." },
      },
    });
    refetchMeMock.mockResolvedValue({
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
        { id: "biz-existing", name: "Existing", slug: "existing", logo: null, role: "Business_owner", permissions: [] },
      ],
    });

    render(<OnboardBusinessPage />);
    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create my business/i }));

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/app/biz-existing"),
    );
  });
});
