"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { Button } from "@/components/buttons";
import { Input } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { acceptActivation, getActivation } from "@/services/activationService";
import { postLoginPath } from "@/lib/postLoginRedirect";
import type { ActivationView } from "@/types";

export default function ActivatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { login } = useAuth();
  const [view, setView] = useState<ActivationView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivation(token)
      .then((v) => {
        if (!cancelled) setView(v);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not look up this activation link.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (password !== confirm) {
      setSubmitError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await acceptActivation(token, password);
      const fresh = await login(res.accessToken);
      router.replace(postLoginPath(fresh));
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Activation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <AuthLayout panelTitle="Hmm, that link didn't open." panelSubtitle="Reach out and we'll send a fresh one.">
        <Status icon={<ShieldAlert className="h-6 w-6" />} title="Activation link error" tone="error">
          <p>{loadError}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </Status>
      </AuthLayout>
    );
  }

  if (!view) {
    return (
      <AuthLayout panelTitle="Setting things up…">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600" />
        </div>
      </AuthLayout>
    );
  }

  if (!view.valid) {
    if (view.expired) {
      return (
        <AuthLayout panelTitle="That link has expired." panelSubtitle="Ask the business owner to send a fresh invite.">
          <Status icon={<ShieldAlert className="h-6 w-6" />} title="Activation link expired" tone="error">
            <p>
              This activation link has expired. Contact support or your business owner to
              request a new one.
            </p>
          </Status>
        </AuthLayout>
      );
    }
    if (view.consumed) {
      return (
        <AuthLayout panelTitle="You're all set." panelSubtitle="Sign in to continue.">
          <Status icon={<CheckCircle2 className="h-6 w-6" />} title="Activation already used" tone="info">
            <p>This link has already been used. Try logging in instead.</p>
            <Button asChild className="mt-4" rightIcon={<ArrowRight className="h-4 w-4" />}>
              <Link href="/login">Sign in</Link>
            </Button>
          </Status>
        </AuthLayout>
      );
    }
    return (
      <AuthLayout panelTitle="That link doesn't look right.">
        <Status icon={<ShieldAlert className="h-6 w-6" />} title="Invalid activation link" tone="error">
          <p>This link is not valid. Contact support.</p>
        </Status>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      panelTitle={`Welcome aboard, ${view.firstName}.`}
      panelSubtitle={`Your seat at ${view.businessName} is ready.`}
    >
      <div className="space-y-2 mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Activate your account
        </span>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome, {view.firstName}.
        </h1>
        <p className="text-sm text-gray-500">
          Set your password to join <strong>{view.businessName}</strong>.
        </p>
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={view.email}
          disabled
          leftIcon={<Mail className="h-4 w-4" />}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
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
            required
          />
          <div className="mt-2">
            <PasswordStrength password={password} />
          </div>
        </div>
        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={submitting}
          rightIcon={!submitting ? <ArrowRight className="h-4 w-4" /> : undefined}
        >
          Activate account
        </Button>
      </form>
    </AuthLayout>
  );
}

function Status({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "error" | "info";
  children: React.ReactNode;
}) {
  const colors =
    tone === "error"
      ? "bg-red-50 text-red-600"
      : "bg-primary-50 text-primary-600";
  return (
    <div className="text-center space-y-3">
      <div
        className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl ${colors}`}
      >
        {icon}
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="text-sm text-gray-600 max-w-sm mx-auto">{children}</div>
    </div>
  );
}
