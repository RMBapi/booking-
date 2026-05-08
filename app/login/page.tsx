"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts";
import { Button } from "@/components/buttons";
import { Input } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { login as loginApi } from "@/services/authService";
import { acceptInvitation } from "@/services/invitationService";
import { postLoginPath } from "@/lib/postLoginRedirect";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, isLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inactiveNotice, setInactiveNotice] = useState<string | null>(null);

  const returnUrl = searchParams.get("returnUrl");
  const invitationToken = searchParams.get("invitation");

  // Compute the right destination for an already-authenticated user.
  // The route guards in AuthContext also catch these — this saves a flash.
  // Note: a Business_owner with no businesses lands on /app — the dashboard
  // renders and prompts them with an onboarding modal on top.
  const destinationFor = (m: typeof me) => {
    if (!m) return "/login";
    if (m.user.passwordChangeRequired) return "/change-password";
    return returnUrl || postLoginPath(m);
  };

  useEffect(() => {
    if (!isLoading && me) {
      router.replace(destinationFor(me));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, isLoading, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setInactiveNotice(null);

    if (!email) {
      setEmailError("Enter your email.");
      return;
    }
    if (!password) {
      setPasswordError("Enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginApi({ email, password });
      if (!res.accessToken) throw new Error("Login response missing accessToken");
      const fresh = await login(res.accessToken);

      if (invitationToken) {
        try {
          await acceptInvitation(invitationToken);
          toast.success("Invitation accepted");
        } catch {
          toast.error(
            "Logged in, but couldn't accept the invitation. Open the link again or contact the inviter.",
          );
        }
      }

      router.replace(destinationFor(fresh));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string } } })?.response
        ?.data;
      const rawMsg = data?.message;
      const msg = typeof rawMsg === "string" ? rawMsg : "";

      if (status === 401 && /pending activation/i.test(msg)) {
        setInactiveNotice(
          "Your account is pending activation by your business owner.",
        );
      } else if (status === 401 && /deactivated/i.test(msg)) {
        setInactiveNotice(
          "Your account has been deactivated. Contact your business owner to restore access.",
        );
      } else if (status === 401 && /inactive/i.test(msg)) {
        setInactiveNotice(
          "Your account isn't active yet. Please contact your administrator to activate it.",
        );
      } else if (status === 401) {
        setFormError("Invalid email or password.");
      } else if (status === 429) {
        setFormError(
          "Too many login attempts. Please wait a moment and try again.",
        );
      } else if (!status) {
        setFormError("Something went wrong. Please try again.");
      } else {
        setFormError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      panelTitle="Welcome back."
      panelSubtitle="Pick up exactly where you left off."
    >
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Sign in to your account
        </h1>
        <p className="text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            href={
              invitationToken
                ? `/register?invitation=${encodeURIComponent(invitationToken)}`
                : "/register"
            }
            className="text-primary-600 font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>

      {inactiveNotice && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {inactiveNotice}
        </div>
      )}
      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError ?? undefined}
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@company.com"
          required
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError ?? undefined}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="pointer-events-auto text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          placeholder="••••••••"
          required
        />

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={submitting}
          rightIcon={!submitting ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
