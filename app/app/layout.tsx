"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { ConnectionError } from "@/components/auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { me, isLoading, authError, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (authError) return; // backend unreachable — show retry, don't redirect
    if (!me) {
      router.replace("/login");
      return;
    }
    if (me.user.systemRole === "Super_Admin") {
      router.replace("/super-admin");
      return;
    }
    if (me.user.systemRole === "Customer") {
      // No customer surface in the CRM — customers use the separate app.
      router.replace("/login");
    }
  }, [me, isLoading, authError, router]);

  if (authError && !me) {
    return <ConnectionError onRetry={retry} />;
  }

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-700" />
      </div>
    );
  }
  return <>{children}</>;
}
