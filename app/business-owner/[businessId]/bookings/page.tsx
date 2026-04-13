"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BookingsAndContacts } from "@/features/business-owner";

export default function BookingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <main className="bo-dashboard-shell flex flex-col gap-6 py-6 lg:py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            View and manage all customer bookings
          </p>
        </div>
        <BookingsAndContacts businessId={businessId} />
      </main>
    </div>
  );
}
