"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BookingsAndContacts } from "@/features/business-owner";

export default function BookingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  return (
    <main className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Operations</p>
        <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
          Bookings
        </h1>
        <p className="mt-1.5 text-sm text-text-tertiary">
          View and manage all customer bookings.
        </p>
      </div>
      <BookingsAndContacts businessId={businessId} />
    </main>
  );
}
