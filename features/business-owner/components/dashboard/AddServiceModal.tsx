"use client";

import React, { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  Info,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useBusinessServices } from "@/features/business-owner";
import type { ServiceStatus } from "@/types";

export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

const defaultForm = {
  name: "",
  description: "",
  price: "",
  status: "Active" as ServiceStatus,
  priceDisplayMode: true,
  isActive: true,
  allowCustomerChooseProvider: true,
};

export function AddServiceModal({
  isOpen,
  onClose,
  businessId,
}: AddServiceModalProps) {
  const [form, setForm] = useState(() => ({ ...defaultForm }));
  const { createService, isCreating } = useBusinessServices(businessId, {});

  const resetForm = useCallback(() => {
    setForm({ ...defaultForm });
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    const priceNum = Number(form.price);
    if (!trimmedName || form.price === "" || Number.isNaN(priceNum)) {
      return;
    }

    createService(
      {
        name: trimmedName,
        description: form.description.trim() || undefined,
        price: priceNum,
        status: form.status === "Inactive" ? "Inactive" : "Active",
        priceDisplayMode: form.priceDisplayMode,
        isActive: form.isActive,
        allowCustomerChooseProvider: form.allowCustomerChooseProvider,
      },
      {
        onSuccess: () => {
          onClose();
          resetForm();
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-service-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-stone-200/50 bg-stone-50/50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="add-service-title"
                    className="text-2xl font-bold text-stone-900"
                  >
                    Add New Service
                  </h2>
                  <p className="mt-0.5 text-sm font-medium text-stone-500">
                    Create a new service for your clients
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
              id="add-service-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-8 py-6"
            >
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="service-name"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700"
                  >
                    <Tag className="h-4 w-4 text-stone-400" />
                    Service Name *
                  </label>
                  <input
                    id="service-name"
                    required
                    type="text"
                    placeholder="e.g., Hair Cut & Styling"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-description"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700"
                  >
                    <FileText className="h-4 w-4 text-stone-400" />
                    Description
                  </label>
                  <textarea
                    id="service-description"
                    rows={3}
                    placeholder="Describe your service..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="service-price"
                      className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700"
                    >
                      <DollarSign className="h-4 w-4 text-stone-400" />
                      Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                        $
                      </span>
                      <input
                        id="service-price"
                        required
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, price: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-8 pr-4 text-stone-900 placeholder:text-stone-400 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="service-status"
                      className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700"
                    >
                      <Info className="h-4 w-4 text-stone-400" />
                      Status
                    </label>
                    <select
                      id="service-status"
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          status: e.target.value as ServiceStatus,
                        }))
                      }
                      className="w-full cursor-pointer appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 transition-all focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          priceDisplayMode: !f.priceDisplayMode,
                        }))
                      }
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-stone-300"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm font-bold text-stone-900">
                          <Eye
                            className={`h-4 w-4 ${
                              form.priceDisplayMode
                                ? "text-stone-900"
                                : "text-stone-400"
                            }`}
                          />
                          Show Price
                        </span>
                        <span className="text-xs text-stone-400">
                          Display publicly
                        </span>
                      </div>
                      <div
                        className={`relative h-6 w-10 rounded-full transition-all ${
                          form.priceDisplayMode
                            ? "bg-stone-900"
                            : "bg-stone-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                            form.priceDisplayMode ? "right-1" : "left-1"
                          }`}
                        />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, isActive: !f.isActive }))
                      }
                      className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-stone-300"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm font-bold text-stone-900">
                          <CheckCircle2
                            className={`h-4 w-4 ${
                              form.isActive
                                ? "text-[#8BA88E]"
                                : "text-stone-400"
                            }`}
                          />
                          Active
                        </span>
                        <span className="text-xs text-stone-400">
                          Ready to book
                        </span>
                      </div>
                      <div
                        className={`relative h-6 w-10 rounded-full transition-all ${
                          form.isActive ? "bg-[#8BA88E]" : "bg-stone-200"
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                            form.isActive ? "right-1" : "left-1"
                          }`}
                        />
                      </div>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        allowCustomerChooseProvider:
                          !f.allowCustomerChooseProvider,
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-stone-300"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-sm font-bold text-stone-900">
                        <Users
                          className={`h-4 w-4 ${
                            form.allowCustomerChooseProvider
                              ? "text-[#D4A574]"
                              : "text-stone-400"
                          }`}
                        />
                        Customer chooses provider
                      </span>
                      <span className="text-xs text-stone-400">
                        {form.allowCustomerChooseProvider
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                    <div
                      className={`relative h-6 w-10 rounded-full transition-all ${
                        form.allowCustomerChooseProvider
                          ? "bg-[#D4A574]"
                          : "bg-stone-200"
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                          form.allowCustomerChooseProvider
                            ? "right-1"
                            : "left-1"
                        }`}
                      />
                    </div>
                  </button>
                </div>
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
                form="add-service-form"
                disabled={isCreating}
                className="flex-1 rounded-2xl bg-stone-900 px-6 py-3 font-bold text-white shadow-lg shadow-stone-900/10 transition-all hover:bg-stone-800 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
              >
                {isCreating ? "Creating…" : "Create Service"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
