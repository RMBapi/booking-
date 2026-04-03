"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Lock,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import {
  useBusinessServices,
  useCreateServiceProviderAccount,
  useServiceProviders,
} from "@/features/business-owner";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

type Step = 1 | 2;

const defaultAccount = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

const defaultAssignment = {
  serviceId: "",
  description: "",
};

export function AddProviderModal({
  isOpen,
  onClose,
  businessId,
}: AddProviderModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [accountData, setAccountData] = useState({ ...defaultAccount });
  const [assignmentData, setAssignmentData] = useState({
    ...defaultAssignment,
  });
  const [createdUserId, setCreatedUserId] = useState("");
  const [accountError, setAccountError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const { services, isLoading: isLoadingServices } = useBusinessServices(
    businessId,
    {
      page: 1,
      limit: 100,
    },
  );
  const { createServiceProviderAccount, isCreating: isCreatingAccount } =
    useCreateServiceProviderAccount();
  const { createServiceProvider, isCreating: isAssigningProvider } =
    useServiceProviders(businessId, {
      page: 1,
      limit: 10,
    });

  const resetForm = useCallback(() => {
    setStep(1);
    setAccountData({ ...defaultAccount });
    setAssignmentData({ ...defaultAssignment });
    setCreatedUserId("");
    setAccountError("");
    setAssignmentError("");
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      resetForm();
    }, 300);
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");

    if (accountData.password.length < 8) {
      setAccountError("Password must be at least 8 characters.");
      return;
    }

    createServiceProviderAccount(
      {
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        email: accountData.email,
        phone: accountData.phone,
        password: accountData.password,
      },
      {
        onSuccess: (response) => {
          setCreatedUserId(response.data.user.id);
          setStep(2);
        },
        onError: (
          err: Error & { response?: { data?: { message?: string } } },
        ) => {
          setAccountError(
            err.response?.data?.message ||
              err.message ||
              "Failed to create account.",
          );
        },
      },
    );
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentError("");

    if (!assignmentData.serviceId) {
      setAssignmentError("Please select a service.");
      return;
    }

    if (!createdUserId) {
      setAssignmentError("Provider account is missing. Please try again.");
      return;
    }

    createServiceProvider(
      {
        serviceId: assignmentData.serviceId,
        userId: createdUserId,
        description: assignmentData.description || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (
          err: Error & { response?: { data?: { message?: string } } },
        ) => {
          setAssignmentError(
            err.response?.data?.message ||
              err.message ||
              "Failed to assign provider.",
          );
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
            aria-hidden
          />

          <motion.div
            key={step}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-provider-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 1 ? (
              <>
                <div className="border-b border-stone-200/50 bg-stone-50/50 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2
                        id="add-provider-title"
                        className="text-2xl font-bold text-stone-900"
                      >
                        Add New Provider
                      </h2>
                      <p className="mt-0.5 text-sm font-medium text-stone-500">
                        Create provider account credentials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-200/50 hover:text-stone-900"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form
                  id="add-provider-account-form"
                  onSubmit={handleAccountSubmit}
                  autoComplete="off"
                  className="flex-1 overflow-y-auto px-8 py-6"
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                          <User className="h-4 w-4 text-stone-400" />
                          First Name *
                        </label>
                        <input
                          required
                          type="text"
                          name="provider-first-name"
                          autoComplete="off"
                          placeholder="John"
                          value={accountData.firstName}
                          onChange={(e) =>
                            setAccountData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                        />
                      </div>

                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                          <User className="h-4 w-4 text-stone-400" />
                          Last Name *
                        </label>
                        <input
                          required
                          type="text"
                          name="provider-last-name"
                          autoComplete="off"
                          placeholder="Doe"
                          value={accountData.lastName}
                          onChange={(e) =>
                            setAccountData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Mail className="h-4 w-4 text-stone-400" />
                        Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        name="provider-email"
                        autoComplete="off"
                        placeholder="john.doe@example.com"
                        value={accountData.email}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Phone className="h-4 w-4 text-stone-400" />
                        Phone Number *
                      </label>
                      <input
                        required
                        type="tel"
                        name="provider-phone"
                        autoComplete="off"
                        placeholder="+1234567890"
                        value={accountData.phone}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Lock className="h-4 w-4 text-stone-400" />
                        Password *
                      </label>
                      <input
                        required
                        type="password"
                        name="provider-password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={accountData.password}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                      />
                      <p className="mt-2 ml-1 text-xs text-stone-400">
                        Minimum 8 characters with uppercase, lowercase, and
                        number
                      </p>
                    </div>

                    {accountError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {accountError}
                      </div>
                    )}
                  </div>
                </form>

                <div className="flex gap-3 border-t border-stone-200/50 bg-stone-50/50 px-8 py-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-2xl border border-stone-200 bg-white px-6 py-3 font-bold text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="add-provider-account-form"
                    disabled={isCreatingAccount}
                    className="flex-1 rounded-2xl bg-stone-900 px-6 py-3 font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isCreatingAccount ? "Creating..." : "Continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-stone-200/50 bg-gradient-to-br from-[#8BA88E]/10 to-[#D4A574]/10 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8BA88E] shadow-lg">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2
                          id="add-provider-title"
                          className="text-2xl font-bold text-stone-900"
                        >
                          Account Created!
                        </h2>
                        <p className="mt-0.5 text-sm font-medium text-stone-600">
                          Now assign services to{" "}
                          {accountData.firstName || "the provider"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-stone-200/50 hover:text-stone-900"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form
                  id="add-provider-assignment-form"
                  onSubmit={handleFinalSubmit}
                  className="flex-1 overflow-y-auto px-8 py-6"
                >
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/50 p-6">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900">
                        <User className="h-4 w-4 text-[#D4A574]" />
                        Provider Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-stone-400">Name</p>
                          <p className="font-bold text-stone-900">
                            {accountData.firstName} {accountData.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-stone-400">Email</p>
                          <p className="font-bold text-stone-900">
                            {accountData.email}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-stone-400">Phone</p>
                          <p className="font-bold text-stone-900">
                            {accountData.phone}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-stone-400">Status</p>
                          <p className="flex items-center gap-1 font-bold text-[#8BA88E]">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                        <Briefcase className="h-4 w-4 text-stone-400" />
                        Select Service *
                      </label>
                      <select
                        required
                        value={assignmentData.serviceId}
                        onChange={(e) =>
                          setAssignmentData((prev) => ({
                            ...prev,
                            serviceId: e.target.value,
                          }))
                        }
                        className="w-full cursor-pointer appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                      >
                        <option value="">Choose a service...</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      {isLoadingServices && (
                        <p className="mt-2 text-xs text-stone-400">
                          Loading services...
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                        <FileText className="h-4 w-4 text-stone-400" />
                        Provider Description (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe the provider's expertise, specialties, or any additional information..."
                        value={assignmentData.description}
                        onChange={(e) =>
                          setAssignmentData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                      />
                    </div>

                    {assignmentError && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {assignmentError}
                      </div>
                    )}
                  </div>
                </form>

                <div className="flex gap-3 border-t border-stone-200/50 bg-stone-50/50 px-8 py-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-2xl border border-stone-200 bg-white px-6 py-3 font-bold text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.97]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    form="add-provider-assignment-form"
                    disabled={isAssigningProvider}
                    className="flex-1 rounded-2xl bg-[#8BA88E] px-6 py-3 font-bold text-white shadow-lg shadow-[#8BA88E]/20 transition-all hover:bg-[#7A9980] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                  >
                    {isAssigningProvider ? "Adding..." : "Add Provider"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
