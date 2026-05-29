"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { PageSkeleton } from "@/components/layout/PageSkeleton";

const CalendarView = dynamic(
  () =>
    import("@/features/business-owner/components/CalendarView").then((m) => ({
      default: m.CalendarView,
    })),
  { loading: () => <PageSkeleton /> },
);

export default function CalendarPage() {
  const params = useParams<{ businessId: string }>();
  return <CalendarView businessId={params.businessId} />;
}
