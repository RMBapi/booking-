"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageLoader } from "@/components";
import { useRoleAuth } from "@/contexts";
import { BookingsAndContacts } from "@/features/business-owner";

export default function BusinessRequestsPage() {
  const router = useRouter();
  const params = useParams<{ businessId: string }>();
  const { getSession, isLoading } = useRoleAuth();
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
    <div className="min-h-screen bg-[#f8f7f4]">
      <main className="bo-dashboard-shell py-10 md:py-14">
        <button
          type="button"
          onClick={() => router.push("/business-owner")}
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-400 transition hover:text-stone-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            Requests & Bookings
          </h1>
          <p className="mt-3 text-2xl font-medium text-stone-500">
            Manage your customer appointments and inquiries.
          </p>
        </div>

        <BookingsAndContacts businessId={businessId} />
      </main>
    </div>
  );
}
