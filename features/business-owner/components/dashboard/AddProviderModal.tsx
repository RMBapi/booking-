"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Phone,
  ShieldAlert,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  useBusinessServices,
  useServiceProviders,
} from "@/features/business-owner";
import { useAddTeamMember } from "@/features/team/hooks";
import { Input } from "@/components/ui";
import { Button } from "@/components/buttons";
import { FEATURES } from "@/types";
import type { FeatureCode } from "@/types";
import { cn } from "@/utils";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

type Step = 1 | 2;

/**
 * Sensible defaults for a service provider — owner can refine in /team.
 * Mirrors the legacy "service provider" capability set: see schedule,
 * view bookings, view services, view providers, view dashboard.
 */
const DEFAULT_PROVIDER_PERMISSIONS: FeatureCode[] = [
  FEATURES.VIEW_DASHBOARD,
  FEATURES.VIEW_BOOKINGS,
  FEATURES.VIEW_CALENDAR,
  FEATURES.VIEW_SERVICES,
  FEATURES.VIEW_PROVIDERS,
];

export function AddProviderModal({
  isOpen,
  onClose,
  businessId,
}: AddProviderModalProps) {
  const { services, isLoading: isLoadingServices } = useBusinessServices(
    businessId,
    { page: 1, limit: 100 },
  );
  const addTeamMember = useAddTeamMember(businessId);
  const { createServiceProvider, isCreating: isAssigningProvider } =
    useServiceProviders(businessId, { page: 1, limit: 10 });

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [description, setDescription] = useState("");

  const [createdUserId, setCreatedUserId] = useState("");
  const [step1Errors, setStep1Errors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  // Reset when the modal closes so reopening starts fresh.
  useEffect(() => {
    if (isOpen) return;
    setStep(1);
    setDirection(1);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setServiceId("");
    setDescription("");
    setCreatedUserId("");
    setStep1Errors({});
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const validateStep1 = (): boolean => {
    const next: typeof step1Errors = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email.";
    if (!phone.trim()) next.phone = "Phone is required.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8)
      next.password = "Use at least 8 characters.";
    setStep1Errors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = async () => {
    setError(null);
    if (!validateStep1()) return;

    try {
      const member = await addTeamMember.mutateAsync({
        firstName,
        lastName,
        email,
        phone,
        role: "Service_Provider",
        permissions: DEFAULT_PROVIDER_PERMISSIONS as string[],
        password,
      });
      setCreatedUserId(member.userId);
      setDirection(1);
      setStep(2);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      const text = Array.isArray(message)
        ? message.join(" ")
        : typeof message === "string"
          ? message
          : "";
      setError(text || "Failed to create provider account.");
    }
  };

  const handleSkip = () => {
    toast.success(`${firstName || "Provider"} added`);
    onClose();
  };

  const handleAssign = () => {
    setError(null);
    if (!serviceId) {
      setError("Please select a service.");
      return;
    }
    if (!createdUserId) {
      setError("Provider account is missing. Please try again.");
      return;
    }

    createServiceProvider(
      {
        serviceId,
        userId: createdUserId,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${firstName || "Provider"} assigned to service`);
          onClose();
        },
        onError: (
          err: Error & { response?: { data?: { message?: string } } },
        ) => {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to assign provider.",
          );
        },
      },
    );
  };

  const stepWidth = step === 1 ? 480 : 640;
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        key="add-provider-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
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
          <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  Step {step} of 2
                </p>
                <h2 className="text-base font-semibold text-text-primary tracking-tight">
                  {step === 1 ? "Provider details" : "Assign service"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="h-1 bg-subtle">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-indigo-500"
              initial={false}
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 24 }}
                  transition={{ duration: 0.22 }}
                  className="px-6 py-5 space-y-4"
                >
                  <p className="text-sm text-text-tertiary">
                    Who are you adding? Set a temporary password and share it
                    with them &mdash; they&apos;ll change it on first sign-in.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      error={step1Errors.firstName}
                      leftIcon={<User className="h-4 w-4" />}
                      required
                    />
                    <Input
                      label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      error={step1Errors.lastName}
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={step1Errors.email}
                    leftIcon={<AtSign className="h-4 w-4" />}
                    required
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={step1Errors.phone}
                    leftIcon={<Phone className="h-4 w-4" />}
                    required
                  />
                  <Input
                    label="Temporary password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={step1Errors.password}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="pointer-events-auto text-text-tertiary hover:text-text-primary"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    placeholder="At least 8 characters"
                    required
                  />

                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 px-3.5 py-3 text-sm text-amber-800">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <p>
                      New providers start in <strong>Pending</strong> and
                      can&apos;t sign in yet. Mark them <strong>Active</strong>
                      {" "}from the Team page when they&apos;re ready.
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600">{error}</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 24 }}
                  transition={{ duration: 0.22 }}
                  className="px-6 py-5 space-y-5"
                >
                  {/* Summary card — account is already created at this point,
                      so it's read-only (no Edit affordance). */}
                  <div className="rounded-xl border border-border-subtle bg-subtle/50 px-4 py-3 flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-primary-100 text-emerald-700 text-xs font-semibold">
                      {initials || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {firstName} {lastName}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        {email}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Created
                    </span>
                  </div>

                  {/* Service select */}
                  <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Service
                    </h3>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                      <select
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        className={cn(
                          "w-full appearance-none rounded-lg border border-border-default bg-surface pl-9 pr-9 py-2.5 text-sm text-text-primary",
                          "focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100",
                          !serviceId && "text-text-tertiary",
                        )}
                      >
                        <option value="">Choose a service…</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary rotate-90 pointer-events-none" />
                    </div>
                    {isLoadingServices && (
                      <p className="mt-1.5 text-xs text-text-tertiary">
                        Loading services…
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Description
                      <span className="ml-1.5 text-[10px] font-normal text-text-tertiary normal-case tracking-normal">
                        (optional)
                      </span>
                    </h3>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-text-tertiary pointer-events-none" />
                      <textarea
                        rows={3}
                        placeholder="Specialties, expertise, or anything customers should know."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full resize-none rounded-lg border border-border-default bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600">{error}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-subtle/40">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleContinue}
                  isLoading={addTeamMember.isPending}
                  rightIcon={
                    !addTeamMember.isPending ? (
                      <ArrowRight className="h-3.5 w-3.5" />
                    ) : undefined
                  }
                >
                  Continue to assign service
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="inline-flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Skip — assign later
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAssign}
                  isLoading={isAssigningProvider}
                  rightIcon={
                    !isAssigningProvider ? (
                      <UserPlus className="h-3.5 w-3.5" />
                    ) : undefined
                  }
                >
                  Assign service
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
