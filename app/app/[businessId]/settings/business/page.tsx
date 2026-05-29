"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft, AtSign, Building2, FileText, Globe, MapPin, Phone } from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useAuth } from "@/contexts";
import { Button } from "@/components/buttons";
import { Input, TextArea, ImageUploader } from "@/components/ui";
import { getBusinessById, updateBusiness } from "@/services/businessService";
import type { Business, UpdateBusinessPayload } from "@/types";
import { cn, isVideoUrl } from "@/utils";

const DESCRIPTION_MAX = 500;

export default function BusinessSettingsPage() {
  return (
    <FeatureGate feature="view_settings" fallback={<AccessDenied />}>
      <BusinessSettingsContent />
    </FeatureGate>
  );
}

function BusinessSettingsContent() {
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

  // Form state — hydrated from the fetched business once and then driven locally.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [backupImage, setBackupImage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!business || hydrated) return;
    setName(business.name ?? "");
    setDescription(business.description ?? "");
    setEmail(business.email ?? "");
    setPhone(business.phone ?? "");
    setAddress(business.address ?? "");
    setLogo(business.logo ?? null);
    setImage(business.image ?? null);
    setBackupImage(business.backupImage ?? null);
    setHydrated(true);
  }, [business, hydrated]);

  const dirty = useMemo(() => {
    if (!business) return false;
    return (
      (business.name ?? "") !== name ||
      (business.description ?? "") !== description ||
      (business.email ?? "") !== email ||
      (business.phone ?? "") !== phone ||
      (business.address ?? "") !== address ||
      (business.logo ?? null) !== logo ||
      (business.image ?? null) !== image ||
      (business.backupImage ?? null) !== backupImage
    );
  }, [business, name, description, email, phone, address, logo, image, backupImage]);

  const saveMutation = useMutation({
    mutationFn: async (payload: UpdateBusinessPayload) => {
      const res = await updateBusiness(businessId, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: async () => {
      toast.success("Business updated.");
      await queryClient.invalidateQueries({ queryKey: ["business", businessId] });
      await refetchMe();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Couldn't save changes.";
      toast.error(typeof message === "string" ? message : "Couldn't save changes.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || saveMutation.isPending) return;
    const payload: UpdateBusinessPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      logo: logo || undefined,
      image: image || undefined,
      backupImage: isVideoUrl(image) ? backupImage || undefined : null,
    };
    saveMutation.mutate(payload);
  };

  const handleReset = () => {
    if (!business) return;
    setName(business.name ?? "");
    setDescription(business.description ?? "");
    setEmail(business.email ?? "");
    setPhone(business.phone ?? "");
    setAddress(business.address ?? "");
    setLogo(business.logo ?? null);
    setImage(business.image ?? null);
    setBackupImage(business.backupImage ?? null);
  };

  if (businessQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-7 w-48 rounded-md shimmer" />
        <div className="h-48 rounded-2xl shimmer" />
        <div className="h-64 rounded-2xl shimmer" />
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

  const coverIsVideo = isVideoUrl(image);

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
          Business information
        </h1>
        <p className="mt-1.5 text-sm text-text-tertiary">
          What customers see, how you receive bookings, and how the business looks.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding */}
        <Section title="Brand" subtitle="Your icon shows up in the sidebar and on customer-facing pages. The cover can be an image or MP4 video at the top of your public site.">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start">
            <ImageUploader
              variant="icon"
              value={logo}
              onChange={setLogo}
              label="Icon"
              hint="Square. Min 96×96px."
            />
            <div className="space-y-6">
              <ImageUploader
                variant="cover"
                value={image}
                onChange={setImage}
                label="Cover image or video"
                hint="Recommended 1600×400px. JPG, PNG, or MP4 up to 20MB."
              />
              {coverIsVideo && (
                <ImageUploader
                  variant="cover"
                  acceptVideo={false}
                  value={backupImage}
                  onChange={setBackupImage}
                  label="Backup cover image"
                  hint="Optional. Shown if the video fails to load. JPG or PNG up to 20MB."
                />
              )}
            </div>
          </div>
        </Section>

        {/* Business details */}
        <Section title="Business details">
          <div className="space-y-4">
            <Input
              label="Business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<Building2 className="h-4 w-4" />}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                URL slug
              </label>
              <div className="flex items-center gap-2 text-sm text-text-tertiary tabular">
                <Globe className="h-3.5 w-3.5" />
                <span>yourdomain.com/</span>
                <span className="font-semibold text-text-primary">{business.slug}</span>
                <span className="ml-2 text-[11px] text-text-quaternary">slug can&apos;t be changed</span>
              </div>
            </div>
            <div>
              <TextArea
                label="Description"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, DESCRIPTION_MAX))
                }
                rows={3}
                helperText="What customers should know about your business."
              />
              <p
                className={cn(
                  "mt-1 text-xs text-right",
                  description.length >= DESCRIPTION_MAX - 20
                    ? "text-amber-600"
                    : "text-text-tertiary",
                )}
              >
                {description.length} / {DESCRIPTION_MAX}
              </p>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Customer contact">
          <div className="space-y-4">
            <Input
              label="Business email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<AtSign className="h-4 w-4" />}
              helperText="Customer-facing email — leave blank to use your account email."
            />
            <Input
              label="Business phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin className="h-4 w-4" />}
            />
          </div>
        </Section>

        {/* Footer actions */}
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
              disabled={!dirty}
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-text-primary tracking-tight inline-flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-text-tertiary" />
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
