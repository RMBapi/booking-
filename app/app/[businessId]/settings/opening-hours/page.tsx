"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft, Clock } from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useAuth } from "@/contexts";
import { Button } from "@/components/buttons";
import { OpeningHoursEditor } from "@/components/business/OpeningHoursEditor";
import { getBusinessById, updateBusiness } from "@/services/businessService";
import {
  hasOpeningHoursErrors,
  hydrateOpeningHours,
  toOpeningHoursPayload,
  validateOpeningHours,
} from "@/lib/openingHours";
import type { Business, OpeningHours, UpdateBusinessPayload } from "@/types";

export default function OpeningHoursSettingsPage() {
  return (
    <FeatureGate feature="view_settings" fallback={<AccessDenied />}>
      <OpeningHoursContent />
    </FeatureGate>
  );
}

function OpeningHoursContent() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const { refetchMe } = useAuth();
  const queryClient = useQueryClient();

  const businessQuery = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const res = await getBusinessById(businessId);
      const body = res.data?.data ?? res.data;
      return body as Business;
    },
    enabled: !!businessId,
  });

  const business = businessQuery.data;

  const [hours, setHours] = useState<OpeningHours>(() => hydrateOpeningHours(null));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!business || hydrated) return;
    setHours(hydrateOpeningHours(business.openingHours));
    setHydrated(true);
  }, [business, hydrated]);

  const dirty = useMemo(() => {
    if (!business) return false;
    return (
      JSON.stringify(toOpeningHoursPayload(hours)) !==
      JSON.stringify(hydrateOpeningHours(business.openingHours))
    );
  }, [business, hours]);

  const errors = useMemo(() => validateOpeningHours(hours), [hours]);

  const saveMutation = useMutation({
    mutationFn: async (payload: UpdateBusinessPayload) => {
      const res = await updateBusiness(businessId, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      toast.success("Opening hours updated.");
      await queryClient.invalidateQueries({ queryKey: ["business", businessId] });
      await refetchMe();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response
          ?.data?.message;
      const text = Array.isArray(message) ? message.join(" ") : message;
      toast.error(typeof text === "string" ? text : "Couldn't save opening hours.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || saveMutation.isPending) return;
    if (hasOpeningHoursErrors(validateOpeningHours(hours))) {
      toast.error("Fix the highlighted opening hours before saving.");
      return;
    }
    saveMutation.mutate({ openingHours: toOpeningHoursPayload(hours) });
  };

  const handleReset = () => {
    if (!business) return;
    setHours(hydrateOpeningHours(business.openingHours));
  };

  if (businessQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-7 w-48 rounded-md shimmer" />
        <div className="h-96 rounded-2xl shimmer" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-10 text-center max-w-3xl">
        <p className="text-sm text-text-tertiary">Couldn&apos;t load this business.</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-8 max-w-3xl">
      <header>
        <Link
          href={`/app/${businessId}/settings`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to settings
        </Link>
        <h1 className="text-3xl font-bold text-text-primary tracking-display">
          Opening hours
        </h1>
        <p className="mt-1.5 text-sm text-text-tertiary">
          When your business is open. Customers see these hours on your public page.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-border-subtle bg-surface p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-text-primary tracking-tight inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-text-tertiary" />
              Weekly schedule
            </h2>
            <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
              Toggle each day open or closed and set its hours.
            </p>
          </div>
          <OpeningHoursEditor
            value={hours}
            onChange={setHours}
            errors={errors}
            disabled={saveMutation.isPending}
          />
        </section>

        <div className="sticky bottom-4 z-10 rounded-2xl border border-border-subtle bg-surface/90 backdrop-blur-xl px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!dirty || saveMutation.isPending}
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!dirty || hasOpeningHoursErrors(errors)}
              isLoading={saveMutation.isPending}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
