"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { AppShell } from "@/components/layout/AppShell";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { me, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ businessId: string }>();

  useEffect(() => {
    if (isLoading || !me) return;
    const membership = me.businesses.find((b) => b.id === params.businessId);
    // Not a member, or membership is Pending/Deactivated — bounce to /app
    // so the landing logic can pick an Active business or show a status
    // notice. Backend already blocks the API calls; this prevents the UI
    // flash and keeps the dashboard out of reach.
    if (!membership || membership.status !== "Active") {
      router.replace("/app");
    }
  }, [me, isLoading, params.businessId, router]);

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
