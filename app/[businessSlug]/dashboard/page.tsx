"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { postLoginPath } from "@/lib/postLoginRedirect";

export default function CustomerDashboard({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = use(params);
  const router = useRouter();
  const { me, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace(`/${businessSlug}/login`);
      return;
    }
    if (me.user.systemRole !== "Customer") {
      router.replace(postLoginPath(me));
    }
  }, [me, isLoading, businessSlug, router]);

  if (isLoading || !me || me.user.systemRole !== "Customer") return null;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-stone-900">{businessSlug}</span>
          <button
            onClick={async () => {
              await logout();
              router.replace(`/${businessSlug}/login`);
            }}
            className="text-sm text-stone-700 hover:text-stone-900"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <h1 className="text-2xl font-semibold text-stone-900">
          Welcome, {me.user.firstName}
        </h1>
        <p className="text-sm text-stone-500">
          Your bookings will appear here.
        </p>
      </main>
    </div>
  );
}
