"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Building2,
  CheckCircle2,
  Globe,
  ImageIcon,
  Phone,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/buttons";
import { Input, TextArea, ImageUploader } from "@/components/ui";
import { useAuth } from "@/contexts";
import { onboardBusiness } from "@/services/businessService";
import { cn } from "@/utils";
import type { CreateOwnBusinessDto } from "@/types";

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

interface FieldErrors {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface OnboardingModalProps {
  /** Whether the modal is currently shown. */
  open: boolean;
  /** Soft-dismiss: closes the modal but the parent should keep
   * `needsOnboarding` true so it returns next session and the dashboard
   * banner stays visible. */
  onSoftDismiss?: () => void;
}

type Step = 1 | 2;

export function OnboardingModal({ open, onSoftDismiss }: OnboardingModalProps) {
  const router = useRouter();
  const { me, refetchMe, setActiveBusinessId } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [bizEmail, setBizEmail] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 fields (branding)
  const [logo, setLogo] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  // Auto-fill slug from name until the user manually edits it.
  React.useEffect(() => {
    if (slugDirty) return;
    setSlug(generateSlug(name));
  }, [name, slugDirty]);

  const slugValid = useMemo(
    () => slug.length > 0 && SLUG_REGEX.test(slug),
    [slug],
  );

  const firstName = me?.user.firstName ?? "there";

  const validateStep1 = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Use at least 2 characters.";
    else if (name.trim().length > 100) next.name = "Maximum 100 characters.";
    if (!slug) next.slug = "URL slug is required.";
    else if (!SLUG_REGEX.test(slug))
      next.slug = "Use lowercase letters, numbers, and hyphens only.";
    if (description.length > DESCRIPTION_MAX)
      next.description = `Maximum ${DESCRIPTION_MAX} characters.`;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const advance = () => {
    setDirection(1);
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    }
  };

  const goBack = () => {
    setDirection(-1);
    if (step === 2) setStep(1);
  };

  const undef = (s: string) => (s.trim() ? s.trim() : undefined);

  const handleFinish = async () => {
    if (!validateStep1()) {
      setStep(1);
      setDirection(-1);
      return;
    }
    setSubmitting(true);
    setTopError(null);
    try {
      const dto: CreateOwnBusinessDto = {
        name: name.trim(),
        slug,
        email: undef(bizEmail),
        phone: undef(bizPhone),
        address: undef(address),
        description: undef(description),
        logo: logo || undefined,
        image: image || undefined,
      };
      const business = await onboardBusiness(dto);
      const fresh = await refetchMe();
      setActiveBusinessId(business.id);
      const targetId = fresh?.businesses[0]?.id ?? business.id;
      toast.success(`Welcome to ${business.name}`);
      router.replace(`/app/${targetId}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const data = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const raw = data?.message;
      const messages = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? [raw]
          : [];
      const joined = messages.join(" ");

      if (status === 409 && /slug/i.test(joined)) {
        setFieldErrors({ slug: "This URL is already taken. Try a different one." });
        setStep(1);
        setDirection(-1);
      } else if (status === 409 && /already have/i.test(joined)) {
        toast("You already have a business — taking you there.");
        const fresh = await refetchMe();
        if (fresh?.businesses[0]) {
          setActiveBusinessId(fresh.businesses[0].id);
          router.replace(`/app/${fresh.businesses[0].id}`);
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
        if (Object.keys(next).length > 0) {
          setFieldErrors(next);
          setStep(1);
          setDirection(-1);
        } else {
          setTopError(joined || "Validation failed.");
        }
      } else {
        setTopError(joined || "Couldn't create your business.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepWidth = step === 1 ? 520 : 640;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, width: stepWidth }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative bg-surface rounded-2xl shadow-2xl shadow-black/10 max-h-[90vh] flex flex-col overflow-hidden"
            style={{ width: stepWidth }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                    Step {step} of 2
                  </p>
                  <h2 className="text-base font-semibold text-text-primary tracking-tight">
                    {step === 1 ? "Tell us about your business" : "Add your brand"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onSoftDismiss}
                title="Finish setup later"
                aria-label="Finish setup later"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-subtle">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-indigo-500"
                initial={false}
                animate={{ width: `${(step / 2) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Body — animated step transition */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 1 ? (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: direction * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 24 }}
                    transition={{ duration: 0.22 }}
                    className="px-6 py-5"
                  >
                    <div className="mb-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                        <Sparkles className="h-3 w-3" />
                        Welcome, {firstName}
                      </span>
                      <p className="text-sm text-text-tertiary mt-2 leading-relaxed">
                        These details show up on your customer-facing booking page. You
                        can change any of them later in Settings.
                      </p>
                    </div>

                    {topError && (
                      <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {topError}
                      </div>
                    )}

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
                          helperText={`yourdomain.com/${slug || "{slug}"}`}
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
                          helperText="What customers should know."
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: direction * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 24 }}
                    transition={{ duration: 0.22 }}
                    className="px-6 py-5"
                  >
                    <div className="mb-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                        <ImageIcon className="h-3 w-3" />
                        Optional
                      </span>
                      <p className="text-sm text-text-tertiary mt-2 leading-relaxed">
                        Upload an icon and a cover image or video. You can add or
                        replace these anytime from Settings.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start">
                      <ImageUploader
                        variant="icon"
                        value={logo}
                        onChange={setLogo}
                        label="Icon"
                        hint="Square, 96×96px+"
                      />
                      <ImageUploader
                        variant="cover"
                        value={image}
                        onChange={setImage}
                        label="Cover image or video"
                        hint="Recommended 1600×400px. MP4 up to 20MB."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-subtle/40">
              <button
                type="button"
                onClick={onSoftDismiss}
                className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
              >
                Finish setup later
              </button>
              <div className="flex items-center gap-2">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Skip branding entirely.
                      setLogo(null);
                      setImage(null);
                      void handleFinish();
                    }}
                    disabled={submitting}
                  >
                    Skip
                  </Button>
                )}
                {step === 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={advance}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    disabled={submitting}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleFinish}
                    isLoading={submitting}
                    rightIcon={
                      !submitting ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined
                    }
                  >
                    Finish setup
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SlugFeedback({ valid }: { valid: boolean }) {
  return (
    <p
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-xs",
        valid ? "text-emerald-600" : "text-rose-600",
      )}
    >
      {valid ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {valid ? "Valid URL slug" : "Lowercase letters, numbers, hyphens only"}
    </p>
  );
}
