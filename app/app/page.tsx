"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts";
import { OnboardingModal } from "@/features/onboarding/OnboardingModal";

const DISMISS_KEY = "onboardingModalDismissed";

export default function AppLandingPage() {
  const { me, isLoading, activeBusinessId, setActiveBusinessId } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  // If they already have a business, route them onwards as before.
  // Prefer an Active membership: Pending/Deactivated members must not be
  // dropped on a business dashboard they can't use.
  useEffect(() => {
    if (isLoading || !me) return;
    if (me.businesses.length === 0) return;
    const activeBusinesses = me.businesses.filter((b) => b.status === "Active");
    if (activeBusinesses.length === 0) return;
    const target =
      activeBusinesses.find((b) => b.id === activeBusinessId) ??
      activeBusinesses[0];
    if (target.id !== activeBusinessId) {
      setActiveBusinessId(target.id);
    }
    router.replace(`/app/${target.id}`);
  }, [me, isLoading, activeBusinessId, setActiveBusinessId, router]);

  // Restore dismiss preference for the current session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DISMISS_KEY) === "1") {
      setModalOpen(false);
    }
  }, []);

  const handleSoftDismiss = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setModalOpen(false);
  };

  if (isLoading || !me) return null;

  // Business_owner who hasn't onboarded yet — render a calm welcome surface
  // and float the onboarding modal on top.
  if (me.user.systemRole === "Business_owner" && me.businesses.length === 0) {
    return (
      <div className="min-h-screen bg-canvas">
        <main className="max-w-3xl mx-auto px-4 py-16">
          <div className="rounded-2xl border border-border-subtle bg-surface p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
              <Sparkles className="h-3 w-3" />
              Welcome
            </span>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mt-3">
              Hi {me.user.firstName} — let&apos;s get your workspace ready.
            </h1>
            <p className="text-sm text-text-tertiary mt-2 leading-relaxed">
              We&apos;re putting your dashboard together now. Once your business
              details are in, you&apos;ll be taking bookings from this screen.
            </p>
            {!modalOpen && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 text-white text-sm font-semibold px-4 py-2 hover:from-primary-600 hover:to-indigo-600 shadow-[0_4px_14px_rgba(14,165,233,0.3)] transition-all"
              >
                Resume setup
              </button>
            )}
          </div>
        </main>

        <OnboardingModal open={modalOpen} onSoftDismiss={handleSoftDismiss} />
      </div>
    );
  }

  // Service_Provider / Customer with no business memberships — show the
  // existing "you're not a member" placeholder.
  if (me.businesses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-surface border border-border-subtle p-8 text-center">
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            You&apos;re not a member of any business yet
          </h1>
          <p className="text-sm text-text-tertiary mb-6">
            Once a business owner invites you, you&apos;ll see your workspace here.
            Have a question? Contact support.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg border border-border-default text-text-primary text-sm font-semibold px-4 py-2.5 hover:bg-subtle"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Defensive: BE rejects login when *all* memberships are non-Active, so
  // we shouldn't normally reach this branch — but if /auth/me returns only
  // Pending/Deactivated rows (e.g. status flipped mid-session), show a
  // status notice instead of dropping them on a dashboard they can't use.
  const allNonActive = me.businesses.every((b) => b.status !== "Active");
  if (allNonActive) {
    const allPending = me.businesses.every((b) => b.status === "Pending");
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-surface border border-border-subtle p-8 text-center">
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            {allPending
              ? "Your account is pending"
              : "Your account is not active"}
          </h1>
          <p className="text-sm text-text-tertiary mb-6">
            {allPending
              ? "Your business owner needs to activate your account before you can sign in."
              : "Your account has been deactivated. Contact your business owner to restore access."}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg border border-border-default text-text-primary text-sm font-semibold px-4 py-2.5 hover:bg-subtle"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
