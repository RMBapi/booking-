"use client";

import React, { useState } from "react";
import { Button } from "@/components";
import { useCreateServiceProviderAccount } from "../hooks";
import { ArrowRight, Lock, Mail, Phone } from "lucide-react";

interface ServiceProviderRegistrationFormProps {
  onSuccess: (userId: string) => void;
}

export const ServiceProviderRegistrationForm: React.FC<
  ServiceProviderRegistrationFormProps
> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const { createServiceProviderAccount, isCreating } =
    useCreateServiceProviderAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    createServiceProviderAccount(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      },
      {
        onSuccess: (response) => {
          // Call success callback with the created user ID
          const userId = response.data.user.id;
          onSuccess(userId);
          // Reset form
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          });
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to create service provider account"
          );
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          Email Address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-14 w-full rounded-2xl border border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Confirm Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          isLoading={isCreating}
          className="h-14 w-full rounded-2xl bg-[#1b1717] text-base font-semibold text-white hover:bg-black"
          rightIcon={!isCreating ? <ArrowRight className="h-5 w-5" /> : undefined}
        >
          {isCreating ? "Creating..." : "Create Provider Account"}
        </Button>
      </div>

    </form>
  );
};
