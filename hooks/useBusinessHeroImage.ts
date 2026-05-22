"use client";

import { useEffect, useState } from "react";
import { resolveBusinessHeroImage } from "@/lib/publicBrand";
import { getBusinessBySlug } from "@/services";

export function useBusinessHeroImage(slug: string | null) {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));

  useEffect(() => {
    if (!slug) {
      setHeroImage(null);
      setBusinessName(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getBusinessBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data) {
          setHeroImage(resolveBusinessHeroImage(res.data));
          setBusinessName(res.data.name ?? null);
        } else {
          setHeroImage(resolveBusinessHeroImage(null));
          setBusinessName(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHeroImage(resolveBusinessHeroImage(null));
          setBusinessName(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { heroImage, businessName, loading };
}
