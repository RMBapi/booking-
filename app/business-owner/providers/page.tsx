"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components";
import { useRoleAuth } from "@/contexts";
import { DashboardHeader, ServiceProviderManagement } from "@/features/business-owner";

export default function ProvidersPage() {
  const router = useRouter();
  const { getSession, isLoading } = useRoleAuth();
  const session = getSession("Business_owner");
  const { user, token } = session;

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/business-owner");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-sans text-stone-700 selection:bg-teal-100 selection:text-teal-900">
      <main className="flex min-w-0 flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto pb-8">
          <ServiceProviderManagement />
        </div>
      </main>
    </div>
  );
}
