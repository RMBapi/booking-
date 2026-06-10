"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MailCheck,
  Phone,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { Button } from "@/components/buttons";
import { Input } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { register as registerApi } from "@/services/authService";
import { getInvitationByToken } from "@/services/invitationService";
import { postLoginPath } from "@/lib/postLoginRedirect";
import { cn } from "@/utils";
import type {
  AuthRegisterPayload,
  BusinessRole,
  InvitationView,
} from "@/types";

type RoleOption = AuthRegisterPayload["role"];

const ROLE_CARDS: Array<{
  value: RoleOption;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "Customer",
    title: "Customer",
    description: "Book services with a business that uses Booking CRM.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    value: "Service_Provider",
    title: "Service provider",
    description: "Provide services as part of an existing business team.",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    value: "Business_owner",
    title: "Business owner",
    description: "Run your own business — bookings, team, customers.",
    icon: <Building2 className="h-5 w-5" />,
  },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const slugParam =
    searchParams.get("businessSiteSlug") || searchParams.get("slug");
  const invitationToken = searchParams.get("invitation");

  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(!!invitationToken);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessSiteSlug, setBusinessSiteSlug] = useState(slugParam ?? "");
  const [role, setRole] = useState<RoleOption>(
    slugParam ? "Customer" : "Customer",
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingActivation, setPendingActivation] = useState(false);

  useEffect(() => {
    if (slugParam) setRole("Customer");
  }, [slugParam]);

  useEffect(() => {
    if (!invitationToken) return;
    setInvitationLoading(true);
    getInvitationByToken(invitationToken)
      .then((view) => {
        setInvitation(view);
        setEmail(view.email);
        setRole(view.role as BusinessRole);
      })
      .catch(() => setErrorMessage("Invitation link is invalid or expired."))
      .finally(() => setInvitationLoading(false));
  }, [invitationToken]);

  const showRoleSelect = !slugParam && !invitation;
  const showBusinessNameField = role === "Business_owner" && !invitation;
  const showCustomerSlugField = role === "Customer" && !invitation && !slugParam;

  const headerTitle = useMemo(() => {
    if (invitation) return `Join ${invitation.businessName}`;
    return "Create your account";
  }, [invitation]);

  const ctaCopy = invitation ? "Accept invitation & create account" : "Create account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (role === "Customer" && !slugParam && !businessSiteSlug) {
      setErrorMessage(
        "Customer registration requires the slug of the business you're booking with.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: AuthRegisterPayload = {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
      };
      if (role === "Business_owner" && businessName) {
        payload.businessName = businessName;
      }
      if (role === "Customer") {
        payload.businessSiteSlug = slugParam || businessSiteSlug;
      }
      if (invitationToken) {
        payload.invitationToken = invitationToken;
      }

      const res = await registerApi(payload);
      const accessToken = res.accessToken;
      const user = res.user;

      if (user?.isActive === false && !invitationToken) {
        setPendingActivation(true);
        return;
      }

      if (!accessToken) {
        setErrorMessage("Registration succeeded but no access token.");
        return;
      }

      const fresh = await login(accessToken);

      // The CRM has no customer surface (customers use the separate app), so
      // everyone routes via postLoginPath — customers land on /login.
      router.replace(postLoginPath(fresh));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Registration failed.";
      setErrorMessage(typeof message === "string" ? message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pendingActivation) {
    return (
      <AuthLayout panelTitle="Almost there." panelSubtitle="Confirm your email to finish setup.">
        <div className="text-center space-y-4">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            We've sent an activation link to <strong>{email}</strong>. Open it to
            set your password and finish creating your account.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      panelTitle={
        invitation
          ? `Welcome to ${invitation.businessName}.`
          : "Start in minutes, scale on your terms."
      }
      panelSubtitle={
        invitation
          ? `You've been invited as ${invitation.role.replace(/_/g, " ").toLowerCase()}.`
          : "Pick the role that fits — you can always change later."
      }
    >
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {headerTitle}
        </h1>
        {!invitation ? (
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-600 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            You're joining <strong>{invitation.businessName}</strong> as{" "}
            <strong className="capitalize">
              {invitation.role.replace(/_/g, " ").toLowerCase()}
            </strong>
            .
          </p>
        )}
      </div>

      {invitation && (
        <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/60 p-4 flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shrink-0">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-primary-900">
              {invitation.businessName}
            </p>
            <p className="text-primary-700/80">
              Set your details below to accept this invitation.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {invitationLoading ? (
        <p className="text-sm text-gray-500">Loading invitation…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Your account
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<UserIcon className="h-4 w-4" />}
                autoComplete="given-name"
                required
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                leftIcon={<UserIcon className="h-4 w-4" />}
                autoComplete="family-name"
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!invitation}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
              required
            />
            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
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
          </section>

          {showRoleSelect && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Account type
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLE_CARDS.map((card) => {
                  const selected = role === card.value;
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => setRole(card.value)}
                      className={cn(
                        "relative rounded-xl border p-4 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                        selected
                          ? "border-primary-500 bg-primary-50/60 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                      )}
                      aria-pressed={selected}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                          selected
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {card.icon}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-gray-900">
                        {card.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        {card.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <AnimatePresence initial={false}>
            {showBusinessNameField && (
              <motion.section
                key="biz-name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Your business
                  </h2>
                  <Input
                    label="Business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    leftIcon={<Building2 className="h-4 w-4" />}
                    helperText="Optional — you can add this later in Settings."
                  />
                </div>
              </motion.section>
            )}
            {showCustomerSlugField && (
              <motion.section
                key="cust-slug"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Business
                  </h2>
                  <Input
                    label="Business slug"
                    value={businessSiteSlug}
                    onChange={(e) => setBusinessSiteSlug(e.target.value)}
                    leftIcon={<Globe className="h-4 w-4" />}
                    helperText="The business you're booking with — ask the business if you're not sure."
                    required
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={submitting}
            rightIcon={!submitting ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {ctaCopy}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary-600 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
