"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/buttons";
import { Input } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { useAuth } from "@/contexts";
import { setAccessToken } from "@/lib/api/accessToken";
import { changePassword } from "@/services/authService";
import { postLoginPath } from "@/lib/postLoginRedirect";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { me, logout, refetchMe } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  const firstName = me?.user.firstName ?? "there";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setTopError(null);

    // Client-side checks
    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: "Use at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords don't match." });
      return;
    }
    if (newPassword === currentPassword) {
      setFieldErrors({
        newPassword: "New password must be different from the current one.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Swap in the freshly minted access token and refetch /auth/me so
      // passwordChangeRequired becomes false.
      setAccessToken(res.accessToken);
      const fresh = await refetchMe();
      toast.success("Password updated successfully");

      if (!fresh) {
        router.replace("/login");
        return;
      }
      // After a successful password change, send everyone to /app — the
      // onboarding modal on the dashboard handles the "no business yet"
      // case for Business_owners.
      router.replace(postLoginPath(fresh));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const raw = data?.message;
      const messages = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? [raw]
          : [];
      const joined = messages.join(" ");

      if (status === 401) {
        setFieldErrors({ currentPassword: "Current password is incorrect" });
      } else if (status === 429) {
        setTopError(
          "Too many attempts. Please wait a moment before trying again.",
        );
      } else if (status === 400) {
        if (/match|mismatch|confirm/i.test(joined)) {
          setFieldErrors({ confirmPassword: "Passwords don't match." });
        } else if (/equal|same|different|reuse/i.test(joined)) {
          setFieldErrors({
            newPassword:
              "New password must be different from the current one.",
          });
        } else {
          setTopError(joined || "Couldn't update password.");
        }
      } else {
        setTopError(joined || "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Logout escape hatch — wrong account, etc. */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10 lg:text-gray-600 lg:hover:text-gray-900 lg:hover:bg-gray-100"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>

      <AuthLayout
        panelTitle="Secure your account."
        panelSubtitle="One last step — set a password only you know."
      >
        <div className="space-y-2 mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Password change required
          </span>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm text-gray-500">
            For security, please change your password before continuing.
          </p>
        </div>

        {topError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {topError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current password"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={fieldErrors.currentPassword}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
                className="pointer-events-auto text-gray-500 hover:text-gray-700"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <div>
            <Input
              label="New password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={fieldErrors.newPassword}
              minLength={8}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                  className="pointer-events-auto text-gray-500 hover:text-gray-700"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />
            <div className="mt-2">
              <PasswordStrength password={newPassword} />
            </div>
          </div>

          <Input
            label="Confirm new password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            minLength={8}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="pointer-events-auto text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            required
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={submitting}
            rightIcon={!submitting ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            Update password
          </Button>
        </form>
      </AuthLayout>
    </div>
  );
}
