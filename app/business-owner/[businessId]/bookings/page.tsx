"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BookingsAndContacts } from "@/features/business-owner";

export default function BookingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <main className="bo-dashboard-shell flex flex-col gap-8 py-10 md:py-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Bookings
          </h1>
          <p className="mt-1 text-base text-stone-500">
            View and manage all customer bookings
          </p>
        </div>
        <BookingsAndContacts businessId={businessId} />
      </main>
    </div>
  );
}
