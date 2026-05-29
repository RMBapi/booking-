"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts";
import {
  acceptInvitation,
  getInvitationByToken,
} from "@/services/invitationService";
import { postLoginPath } from "@/lib/postLoginRedirect";
import type { InvitationView } from "@/types";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, isLoading, refetchMe } = useAuth();
  const token = searchParams.get("token");
  const [view, setView] = useState<InvitationView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      return;
    }
    getInvitationByToken(token)
      .then(setView)
      .catch(() => setError("Invalid or expired invitation."));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await acceptInvitation(token);
      const fresh = await refetchMe();
      toast.success("Invitation accepted");
      router.replace(fresh ? postLoginPath(fresh) : "/app");
    } catch {
      toast.error("Could not accept the invitation.");
    } finally {
      setAccepting(false);
    }
  };

  if (error) return <Frame title="Invitation error">{error}</Frame>;
  if (!view || isLoading) return <Frame title="Loading…">{null}</Frame>;

  if (view.isExpired)
    return (
      <Frame title="Invitation expired">
        Ask the business owner to send you a new invitation.
      </Frame>
    );
  if (view.isRevoked)
    return (
      <Frame title="Invitation revoked">
        This invitation was cancelled.
      </Frame>
    );
  if (view.isAccepted)
    return (
      <Frame title="Already accepted">
        You're already a member of this business.{" "}
        <Link href="/app" className="text-stone-900 font-semibold hover:underline">
          Open the app
        </Link>
      </Frame>
    );

  if (!me) {
    const loginHref = `/login?invitation=${encodeURIComponent(token!)}`;
    const registerHref = `/register?invitation=${encodeURIComponent(
      token!,
    )}&email=${encodeURIComponent(view.email)}`;
    return (
      <Frame title={`Join ${view.businessName}`}>
        <p className="text-sm text-stone-600 mb-6">
          You've been invited to join <strong>{view.businessName}</strong> as{" "}
          <strong>{view.role.replace(/_/g, " ")}</strong>. Sign in or create an
          account to continue.
        </p>
        <div className="flex gap-3">
          <Link
            href={loginHref}
            className="inline-block rounded-lg bg-stone-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-stone-800"
          >
            Sign in
          </Link>
          <Link
            href={registerHref}
            className="inline-block rounded-lg border border-stone-300 text-stone-900 text-sm font-semibold px-4 py-2.5 hover:bg-stone-50"
          >
            Create account
          </Link>
        </div>
      </Frame>
    );
  }

  if (me.user.email !== view.email) {
    return (
      <Frame title="Wrong account">
        This invitation was sent to <strong>{view.email}</strong>, but you're
        signed in as <strong>{me.user.email}</strong>. Sign out and sign back in
        with the invited email.
      </Frame>
    );
  }

  return (
    <Frame title={`Join ${view.businessName}`}>
      <p className="text-sm text-stone-600 mb-6">
        You've been invited to join <strong>{view.businessName}</strong> as{" "}
        <strong>{view.role.replace(/_/g, " ")}</strong>.
      </p>
      <button
        onClick={handleAccept}
        disabled={accepting}
        className="rounded-lg bg-stone-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-stone-800 disabled:opacity-50"
      >
        {accepting ? "Accepting…" : "Accept invitation"}
      </button>
    </Frame>
  );
}

function Frame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
        <h1 className="text-2xl font-semibold text-stone-900 mb-4">{title}</h1>
        <div className="text-sm text-stone-600">{children}</div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
