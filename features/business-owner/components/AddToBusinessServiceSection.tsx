"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components";
import { useGetMyBusinesses, useBusinessServices } from "../hooks";
import { useServiceProviders } from "../hooks";
import { Business, Service } from "@/types";
import { BadgeCheck, Building2, CheckCircle2 } from "lucide-react";

interface AddToBusinessServiceSectionProps {
  userId: string;
  onComplete: () => void;
  onEditAccount?: () => void;
}

export const AddToBusinessServiceSection: React.FC<
  AddToBusinessServiceSectionProps
> = ({ userId, onComplete, onEditAccount }) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { businesses, isLoading: isLoadingBusinesses } = useGetMyBusinesses();
  const {
    services,
    isLoading: isLoadingServices,
  } = useBusinessServices(
    selectedBusinessId || null,
    { page: 1, limit: 100 }
  );
  const { createServiceProvider, isCreating } = useServiceProviders(
    selectedBusinessId || null,
    { page: 1, limit: 10 }
  );

  // Reset service selection when business changes
  useEffect(() => {
    setSelectedServiceId("");
  }, [selectedBusinessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedBusinessId || !selectedServiceId) {
      setError("Please select both business and service");
      return;
    }

    createServiceProvider(
      {
        serviceId: selectedServiceId,
        userId: userId,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          onComplete();
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to add service provider"
          );
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-green-100 bg-green-50/60 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <BadgeCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">Account Created Successfully!</p>
            <p className="text-sm italic text-gray-600">Now assign this provider to a business unit.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          Select Business <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            className="h-14 w-full appearance-none rounded-2xl border border-gray-300 bg-white pl-12 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400"
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            required
            disabled={isLoadingBusinesses}
          >
            <option value="">-- Choose Business --</option>
            {businesses.map((business: Business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBusinessId && (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Select Service <span className="text-red-500">*</span>
          </label>
          {isLoadingServices ? (
            <div className="h-14 rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="h-14 rounded-2xl border border-gray-300 bg-white px-4 py-4 text-sm text-gray-500">
              No services available for this business
            </div>
          ) : (
            <select
              className="h-14 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
            >
              <option value="">-- Choose Service --</option>
              {services.map((service: Service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${Number(service.price).toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          Provider Description (Optional)
        </label>
        <textarea
          className="min-h-[130px] w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the provider's expertise or role..."
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onEditAccount}
          disabled={!onEditAccount}
          className="h-14 rounded-2xl border border-gray-200 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit Account
        </Button>
        <Button
          type="submit"
          isLoading={isCreating}
          disabled={!selectedBusinessId || !selectedServiceId}
          className="h-14 rounded-2xl bg-[#8f8c8c] text-base font-semibold text-white hover:bg-[#7f7b7b]"
          rightIcon={!isCreating ? <CheckCircle2 className="h-5 w-5" /> : undefined}
        >
          {isCreating ? "Adding..." : "Confirm & Add Provider"}
        </Button>
      </div>
    </form>
  );
};
