"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  useAddTeamMember,
  useAvailableFeatures,
  useUpdateTeamMember,
} from "./hooks";
import { PermissionPicker } from "./PermissionPicker";
import { Input } from "@/components/ui";
import { Button } from "@/components/buttons";
import type { BusinessRole } from "@/types";
import { cn } from "@/utils";

interface Props {
  businessId: string;
  open: boolean;
  onClose: () => void;
  /**
   * The current caller's role inside this business. Used to restrict the
   * role select: a Service_Provider with manage_team can only invite other
   * Service_Providers (frontend-only — backend allows either).
   */
  callerRole: BusinessRole;
  /** Called with the just-invited email so the parent can highlight the new row. */
  onInvited?: (email: string) => void;
}

type Step = 1 | 2;

const ROLE_CARDS: Array<{
  role: BusinessRole;
  title: string;
  description: string;
  ownerOnly?: boolean;
}> = [
  {
    role: "Service_Provider",
    title: "Service Provider",
    description: "Takes bookings, manages their own calendar.",
  },
  {
    role: "Business_owner",
    title: "Business Owner",
    description: "Full access including team, billing, and settings.",
    ownerOnly: true,
  },
];

export function AddMemberModal({
  businessId,
  open,
  onClose,
  callerRole,
  onInvited,
}: Props) {
  const { data: features = [] } = useAvailableFeatures(businessId);
  const addMember = useAddTeamMember(businessId);
  const updateMember = useUpdateTeamMember(businessId);

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<BusinessRole>("Service_Provider");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step1Errors, setStep1Errors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  const canAssignOwner = callerRole === "Business_owner";

  // Reset whenever the modal closes so reopening starts fresh.
  useEffect(() => {
    if (open) return;
    setStep(1);
    setDirection(1);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setRole("Service_Provider");
    setPermissions([]);
    setError(null);
    setStep1Errors({});
  }, [open]);

  if (!open) return null;

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

  const handleContinue = () => {
    if (!validateStep1()) return;
    setDirection(1);
    setStep(2);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateStep1()) {
      setStep(1);
      setDirection(-1);
      return;
    }
    try {
      // Backend creates every member in Pending. The Team page is the
      // explicit role-assignment surface, so members added here go straight
      // to Active — the owner has already chosen their role + permissions.
      const created = await addMember.mutateAsync({
        firstName,
        lastName,
        email,
        phone,
        role,
        permissions: role === "Business_owner" ? [] : permissions,
        password,
      });
      try {
        await updateMember.mutateAsync({
          userId: created.userId,
          dto: { status: "Active" },
        });
      } catch {
        // Activation is best-effort. If the PATCH fails, the member is
        // still created (in Pending) and the owner can flip them from
        // the Team row menu.
      }
      toast.success(`${firstName || email} added`);
      onInvited?.(email);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Could not add member.";
      setError(typeof message === "string" ? message : "Could not add member.");
    }
  };

  const stepWidth = step === 1 ? 480 : 640;
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        key="add-member-modal"
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
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
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
                  {step === 1 ? "Member details" : "Role & permissions"}
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
                    Who are you adding? Set a temporary password and share it with
                    them &mdash; they&apos;ll change it on first sign-in.
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
                  <p className="text-xs text-text-tertiary">
                    Share this password with the member directly. They&apos;ll be
                    asked to change it the first time they sign in.
                  </p>
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
                  {/* Summary card */}
                  <div className="rounded-xl border border-border-subtle bg-subtle/50 px-4 py-3 flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-primary-700 text-xs font-semibold">
                      {initials || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        Adding {firstName} {lastName}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">{email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Role picker — radio cards */}
                  <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Role
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ROLE_CARDS.filter((r) => !r.ownerOnly || canAssignOwner).map(
                        (r) => {
                          const active = role === r.role;
                          return (
                            <button
                              key={r.role}
                              type="button"
                              onClick={() => setRole(r.role)}
                              className={cn(
                                "relative text-left rounded-xl border p-3.5 transition-all",
                                active
                                  ? "border-primary-300 bg-primary-50/40 ring-2 ring-primary-100"
                                  : "border-border-subtle hover:border-border-default bg-surface",
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-text-primary">
                                    {r.title}
                                  </p>
                                  <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
                                    {r.description}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "inline-flex h-5 w-5 items-center justify-center rounded-full border shrink-0 transition-colors",
                                    active
                                      ? "border-primary-500 bg-primary-500 text-white"
                                      : "border-border-default bg-surface",
                                  )}
                                >
                                  {active && <Check className="h-3 w-3" />}
                                </span>
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Permissions */}
                  {role === "Business_owner" ? (
                    <div className="rounded-xl border border-border-subtle bg-subtle/50 p-4 flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-text-secondary">
                        Business owners get all features automatically. No permissions
                        to pick.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        Permissions
                      </h3>
                      <PermissionPicker
                        features={features}
                        selected={permissions}
                        onChange={setPermissions}
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-rose-600">{error}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-subtle/40">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            {step === 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleContinue}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Continue to permissions
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                isLoading={addMember.isPending || updateMember.isPending}
                rightIcon={
                  !(addMember.isPending || updateMember.isPending) ? (
                    <UserPlus className="h-3.5 w-3.5" />
                  ) : undefined
                }
              >
                Add member
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
