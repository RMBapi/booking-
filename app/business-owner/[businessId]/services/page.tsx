"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRoleAuth } from "@/contexts";
import { Button, PageLoader } from "@/components";
import { ServiceManagement } from "@/features/business-owner";

export default function BusinessServicesPage() {
  const router = useRouter();
  const params = useParams<{ businessId: string }>();
  const { getSession, logout: logoutRole, isLoading } = useRoleAuth();
  const businessOwnerSession = getSession("Business_owner");
  const { user, token } = businessOwnerSession;

  const businessId = params.businessId;

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/business-owner");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="bo-dashboard-shell flex flex-col gap-6 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Services
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/business-owner")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logoutRole("Business_owner");
                router.push("/auth/login/business-owner");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
        <ServiceManagement businessId={businessId} />
      </main>
    </div>
  );
}
