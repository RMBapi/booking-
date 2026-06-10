"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  AtSign,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  LogOut,
  MapPin,
  Phone,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/buttons";
import { Card, Input, Switch, TextArea } from "@/components/ui";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OpeningHoursEditor } from "@/components/business/OpeningHoursEditor";
import { useAuth } from "@/contexts";
import { onboardBusiness } from "@/services/businessService";
import {
  defaultOpeningHours,
  hasOpeningHoursErrors,
  toOpeningHoursPayload,
  validateOpeningHours,
} from "@/lib/openingHours";
import { cn } from "@/utils";
import type { CreateOwnBusinessDto, OpeningHours } from "@/types";

interface FieldErrors {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DESCRIPTION_MAX = 500;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OnboardBusinessPage() {
  const router = useRouter();
  const { me, refetchMe, setActiveBusinessId, logout } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [bizEmail, setBizEmail] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [setHoursNow, setSetHoursNow] = useState(false);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(() =>
    defaultOpeningHours(),
  );

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  // Auto-fill slug from name until the user manually edits it.
  useEffect(() => {
    if (slugDirty) return;
    setSlug(generateSlug(name));
  }, [name, slugDirty]);

  const slugValid = slug.length > 0 && SLUG_REGEX.test(slug);
  const firstName = me?.user.firstName ?? "there";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const undef = (s: string) => (s.trim() ? s.trim() : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setTopError(null);

    // Client-side validation
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Use at least 2 characters.";
    if (name.trim().length > 100) next.name = "Maximum 100 characters.";
    if (!slug) next.slug = "URL slug is required.";
    else if (!SLUG_REGEX.test(slug))
      next.slug = "Use lowercase letters, numbers, and hyphens only.";
    if (description.length > DESCRIPTION_MAX)
      next.description = `Maximum ${DESCRIPTION_MAX} characters.`;
    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      return;
    }

    if (setHoursNow && hasOpeningHoursErrors(validateOpeningHours(openingHours))) {
      setTopError("Fix the highlighted opening hours, or turn them off for now.");
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateOwnBusinessDto = {
        name: name.trim(),
        slug,
        email: undef(bizEmail),
        phone: undef(bizPhone),
        address: undef(address),
        description: undef(description),
        openingHours: setHoursNow
          ? toOpeningHoursPayload(openingHours)
          : undefined,
      };
      const business = await onboardBusiness(dto);

      // Reflect the new membership in /auth/me + active business.
      const fresh = await refetchMe();
      setActiveBusinessId(business.id);
      toast.success(`Welcome to ${business.name}!`);

      // Prefer the freshly loaded business id from /auth/me; fall back to
      // the response if /auth/me hasn't settled yet.
      const targetId = fresh?.businesses[0]?.id ?? business.id;
      router.replace(`/app/${targetId}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const raw = data?.message;
      const messages = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? [raw]
          : [];
      const joined = messages.join(" ");

      if (status === 409) {
        if (/already have/i.test(joined)) {
          toast("You already have a business — taking you there.");
          const fresh = await refetchMe();
          if (fresh?.businesses[0]) {
            setActiveBusinessId(fresh.businesses[0].id);
            router.replace(`/app/${fresh.businesses[0].id}`);
          } else {
            router.replace("/app");
          }
        } else if (/slug/i.test(joined)) {
          setFieldErrors({
            slug: "This URL is already taken. Try a different one.",
          });
        } else {
          setTopError(joined);
        }
      } else if (status === 400) {
        const next: FieldErrors = {};
        for (const m of messages) {
          if (/\bname\b/i.test(m)) next.name = m;
          else if (/\bslug\b/i.test(m)) next.slug = m;
          else if (/\bemail\b/i.test(m)) next.email = m;
          else if (/\bphone\b/i.test(m)) next.phone = m;
          else if (/\baddress\b/i.test(m)) next.address = m;
          else if (/\bdescription\b/i.test(m)) next.description = m;
        }
        if (Object.keys(next).length > 0) setFieldErrors(next);
        else setTopError(joined || "Validation failed.");
      } else if (status === 403) {
        setTopError(
          "You don't have permission to onboard a business. Contact support.",
        );
      } else {
        setTopError(joined || "Couldn't create your business.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 lg:top-6 lg:right-6 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10 lg:text-gray-600 lg:hover:text-gray-900 lg:hover:bg-gray-100"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>

      <AuthLayout
        panelTitle="Set up your business."
        panelSubtitle="A few minutes now and you're ready to take bookings."
      >
        <div className="space-y-2 mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <Sparkles className="h-3.5 w-3.5" />
            One last step
          </span>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm text-gray-500">
            Let's set up your business. You can update any of this later.
          </p>
        </div>

        {topError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {topError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <Input
              label="Business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              leftIcon={<Building2 className="h-4 w-4" />}
              required
            />
            <div>
              <Input
                label="URL slug"
                value={slug}
                onChange={(e) => {
                  setSlugDirty(true);
                  setSlug(e.target.value);
                }}
                error={fieldErrors.slug}
                leftIcon={<Globe className="h-4 w-4" />}
                helperText={`Used in your business URL: yourdomain.com/${slug || "{slug}"}`}
                required
              />
              {slug && !fieldErrors.slug && (
                <SlugFeedback valid={slugValid} />
              )}
            </div>
            <Input
              label="Business email"
              type="email"
              value={bizEmail}
              onChange={(e) => setBizEmail(e.target.value)}
              error={fieldErrors.email}
              leftIcon={<AtSign className="h-4 w-4" />}
              helperText="Customer-facing email — leave blank to use your account email."
            />
            <Input
              label="Business phone"
              type="tel"
              value={bizPhone}
              onChange={(e) => setBizPhone(e.target.value)}
              error={fieldErrors.phone}
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <TextArea
              label="Business address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={fieldErrors.address}
              rows={2}
            />
            <div>
              <TextArea
                label="Description"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, DESCRIPTION_MAX))
                }
                error={fieldErrors.description}
                rows={3}
                helperText="What do customers need to know?"
              />
              <p
                className={cn(
                  "mt-1 text-xs text-right",
                  description.length >= DESCRIPTION_MAX - 20
                    ? "text-amber-600"
                    : "text-gray-500",
                )}
              >
                {description.length} / {DESCRIPTION_MAX}
              </p>
            </div>
          </div>

          {/* Opening hours — optional at onboarding; can be set later in settings. */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Opening hours
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Optional — you can set these now or later in settings.
                  </p>
                </div>
              </div>
              <Switch
                checked={setHoursNow}
                onCheckedChange={setSetHoursNow}
                label="Set opening hours now"
              />
            </div>
            {setHoursNow && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <OpeningHoursEditor
                  value={openingHours}
                  onChange={setOpeningHours}
                  errors={validateOpeningHours(openingHours)}
                  disabled={submitting}
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={submitting}
            rightIcon={!submitting ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            Create my business
          </Button>
        </form>
      </AuthLayout>
    </div>
  );
}

function SlugFeedback({ valid }: { valid: boolean }) {
  return (
    <p
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-xs",
        valid ? "text-emerald-600" : "text-red-600",
      )}
    >
      {valid ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {valid ? "Valid URL slug" : "Use lowercase letters, numbers, and hyphens only"}
    </p>
  );
}
