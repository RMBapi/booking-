"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/buttons";
import { Card, Input } from "@/components/ui";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { createBusinessOwner } from "@/services/adminService";
import type { CreateBusinessOwnerDto } from "@/types";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  _form?: string;
}

const FIELD_HINTS: Array<{ pattern: RegExp; field: keyof FormErrors }> = [
  { pattern: /firstName/i, field: "firstName" },
  { pattern: /lastName/i, field: "lastName" },
  { pattern: /\bemail\b/i, field: "email" },
  { pattern: /\bphone\b/i, field: "phone" },
  { pattern: /confirmPassword/i, field: "confirmPassword" },
  { pattern: /\bpassword\b/i, field: "password" },
];

function mapServerErrors(messages: string[]): FormErrors {
  const out: FormErrors = {};
  const unmatched: string[] = [];
  for (const msg of messages) {
    const hit = FIELD_HINTS.find((h) => h.pattern.test(msg));
    if (hit && !out[hit.field]) {
      out[hit.field] = msg;
    } else if (!hit) {
      unmatched.push(msg);
    }
  }
  if (unmatched.length > 0) out._form = unmatched.join(" ");
  return out;
}

export default function NewBusinessOwnerPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateClient = (): boolean => {
    const next: FormErrors = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirmPassword !== password)
      next.confirmPassword = "Passwords don't match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateClient()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const dto: CreateBusinessOwnerDto = {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
      };
      await createBusinessOwner(dto);
      toast.success(
        "Business owner created. Share the password with them securely. They'll be prompted to change it on first login.",
      );
      router.replace("/super-admin/business-owners");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const data = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const raw = data?.message;
      const messages = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? [raw]
          : ["Could not create business owner."];

      if (status === 409) {
        setErrors({ email: "An account with this email already exists." });
      } else if (status === 400) {
        setErrors(mapServerErrors(messages));
      } else {
        setErrors({ _form: messages.join(" ") });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <Link
          href="/super-admin/business-owners"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Back to business owners"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Business Owner
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provision the account only — they'll set their business up
            themselves on first login.
          </p>
        </div>
      </div>

      {errors._form && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Owner details" subtitle="Their personal contact info.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                leftIcon={<UserIcon className="h-4 w-4" />}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={errors.lastName}
                leftIcon={<UserIcon className="h-4 w-4" />}
                required
                autoComplete="family-name"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              leftIcon={<Phone className="h-4 w-4" />}
              required
              autoComplete="tel"
            />
          </div>
        </Card>

        <Card
          title="Temporary password"
          subtitle="They'll be forced to change this on their first login."
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                You'll need to share this password with the owner securely
                (not via email). They'll change it on first login.
              </span>
            </div>
            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                minLength={8}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="pointer-events-auto text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />
              <div className="mt-2">
                <PasswordStrength password={password} />
              </div>
            </div>
            <Input
              label="Confirm password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              minLength={8}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="pointer-events-auto text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Create owner
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
