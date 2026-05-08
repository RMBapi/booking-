"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getBusinessBySlug } from "@/services/businessService";

interface BusinessPublic {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string | null;
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
        <div className="flex justify-center gap-2">
          <Link
            href={`/${businessSlug}/login`}
            className="inline-block rounded-lg bg-stone-900 text-white text-sm font-semibold px-4 py-2.5 hover:bg-stone-800"
          >
            Customer sign in
          </Link>
          <Link
            href={`/register?slug=${encodeURIComponent(businessSlug)}`}
            className="inline-block rounded-lg border border-stone-300 text-stone-900 text-sm font-semibold px-4 py-2.5 hover:bg-stone-50"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
