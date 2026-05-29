"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { me, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    if (me.user.systemRole === "Super_Admin") {
      router.replace("/super-admin");
      return;
    }
    if (me.user.systemRole === "Customer") {
      const slug = me.businesses[0]?.slug;
      router.replace(slug ? `/${slug}/dashboard` : "/login");
    }
  }, [me, isLoading, router]);

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-700" />
      </div>
    );
  }
  return <>{children}</>;
}
