"use client";

import { use, useEffect, useState } from "react";
import { getBusinessBySlug } from "@/services/businessService";
import {
  DAY_LABELS,
  DAY_ORDER,
  formatOpeningHoursRow,
} from "@/lib/openingHours";
import type { OpeningHours } from "@/types";

interface BusinessPublic {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string | null;
  openingHours?: OpeningHours | null;
}

export default function BusinessPublicPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = use(params);
  const [biz, setBiz] = useState<BusinessPublic | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBusinessBySlug(businessSlug)
      .then((res: { data?: BusinessPublic } & BusinessPublic) => {
        if (cancelled) return;
        setBiz(res?.data ?? res);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load business.");
      });
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-stone-600">{loadError}</p>
      </div>
    );
  }
  if (!biz) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-700" />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          {biz.name}
        </h1>
        {biz.description && (
          <p className="text-sm text-stone-500 mb-6">{biz.description}</p>
        )}
        {biz.openingHours && (
          <div className="mb-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Opening hours
            </p>
            <dl className="divide-y divide-stone-100">
              {DAY_ORDER.map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <dt className="text-stone-600">{DAY_LABELS[day]}</dt>
                  <dd className="font-medium text-stone-900 tabular-nums">
                    {formatOpeningHoursRow(biz.openingHours![day])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
