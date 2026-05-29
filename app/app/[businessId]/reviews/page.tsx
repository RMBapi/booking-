"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { PageSkeleton } from "@/components/layout/PageSkeleton";

const ReviewsList = dynamic(
  () =>
    import("@/features/business-owner/components/ReviewsList").then((m) => ({
      default: m.ReviewsList,
    })),
  { loading: () => <PageSkeleton /> },
);

export default function ReviewsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  return (
    <FeatureGate feature="view_contacts" fallback={<AccessDenied />}>
      <main className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Feedback
          </p>
          <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">Reviews</h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            See what customers are saying about their completed bookings.
          </p>
        </div>
        <ReviewsList businessId={businessId} />
      </main>
    </FeatureGate>
  );
}
