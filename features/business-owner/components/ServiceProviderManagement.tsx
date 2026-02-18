"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@/components";
import { useCloseModal } from "@/components/ui/Modal";
import {
  useGetMyBusinesses,
  useBusinessServices,
  useServiceProviders,
} from "../hooks";
import {
  ServiceProviderRegistrationForm,
  AddToBusinessServiceSection,
} from "./";
import { Business, Service, ServiceProvider } from "@/types";
import {
  Building2,
  Ellipsis,
  Filter,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";

export const ServiceProviderManagement: React.FC = () => {
  const router = useRouter();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [showAddToBusinessService, setShowAddToBusinessService] = useState(false);
  const [showServiceFilter, setShowServiceFilter] = useState(false);

  const { businesses, isLoading: isLoadingBusinesses } = useGetMyBusinesses();
  const { services, isLoading: isLoadingServices } = useBusinessServices(
    selectedBusinessId || null,
    { page: 1, limit: 100 }
  );
  const { providers, isLoading: isLoadingProviders } = useServiceProviders(
    selectedBusinessId || null,
    {
      page: 1,
      limit: 100,
      serviceId: selectedServiceId || undefined,
      search: searchTerm || undefined,
    }
  );

  // Reset service filter when business changes
  useEffect(() => {
    setSelectedServiceId("");
  }, [selectedBusinessId]);

  const getBusinessName = (id: string) => {
    const business = businesses.find((b: Business) => b.id === id);
    return business?.name || id;
  };

  const getServiceName = (id: string) => {
    const service = services.find((s: Service) => s.id === id);
    return service?.name || id;
  };

  // Improved provider name display - check if API response includes user data
  const getProviderDisplayName = (provider: ServiceProvider) => {
    // Check if provider has user data (API might include it even if not typed)
    const providerWithUser = provider as ServiceProvider & { user?: { firstName?: string; lastName?: string; email?: string } };
    if (providerWithUser.user?.firstName && providerWithUser.user?.lastName) {
      return `${providerWithUser.user.firstName} ${providerWithUser.user.lastName}`;
    }
    // Fallback: Use email if available
    if (providerWithUser.user?.email) {
      return providerWithUser.user.email.split("@")[0];
    }
    // Final fallback: Use a formatted version of userId
    return `Provider ${provider.userId.slice(0, 8)}...`;
  };

  const getProviderEmail = (provider: ServiceProvider) => {
    const providerWithUser = provider as ServiceProvider & { user?: { email?: string } };
    return providerWithUser.user?.email || `ID: ${provider.userId}`;
  };

  const getProviderPhone = (provider: ServiceProvider) => {
    const providerWithUser = provider as ServiceProvider & { user?: { phone?: string } };
    return providerWithUser.user?.phone || provider.description || "No phone information yet";
  };

  const handleAccountCreated = (userId: string) => {
    setCreatedUserId(userId);
    setShowAddToBusinessService(true);
  };

  const handleAddToBusinessServiceComplete = () => {
    setCreatedUserId(null);
    setShowAddToBusinessService(false);
  };

  const CreateProviderModalContent: React.FC = () => {
    const closeModal = useCloseModal();

    const handleClose = () => {
      setCreatedUserId(null);
      setShowAddToBusinessService(false);
      closeModal();
    };

    return (
      <div className="p-8 md:p-12">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-7 top-7 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1b1717] text-white">
            {showAddToBusinessService ? (
              <Building2 className="h-7 w-7" />
            ) : (
              <UserRoundPlus className="h-7 w-7" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              {showAddToBusinessService ? "Assign Business" : "Create Account"}
            </h3>
            <p className="text-lg font-semibold text-gray-600 md:text-xl">
              {showAddToBusinessService ? "Step 2 of 2" : "Step 1 of 2"}
            </p>
          </div>
        </div>

        {showAddToBusinessService && createdUserId ? (
          <AddToBusinessServiceSection
            userId={createdUserId}
            onComplete={() => {
              handleAddToBusinessServiceComplete();
              closeModal();
            }}
            onEditAccount={() => setShowAddToBusinessService(false)}
          />
        ) : (
          <ServiceProviderRegistrationForm onSuccess={handleAccountCreated} />
        )}
      </div>
    );
  };

  return (
    <section className="bo-dashboard-shell py-10">
      <Modal>
        {/* Header Section with proper spacing */}
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => router.push("/business-owner")}
              className="mb-6 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-stone-400 transition hover:text-stone-600"
            >
              <span aria-hidden="true">&#8249;</span>
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 md:text-5xl lg:text-6xl">
              Service Providers
            </h1>
            <p className="mt-4 text-lg font-medium text-stone-500">
              Manage your team members and their assignments.
            </p>
          </div>
          <div className="flex shrink-0 items-start">
            <Modal.Open opens="createServiceProviderAccount">
              <Button
                size="lg"
                className="h-16 rounded-3xl bg-[#1b1717] px-8 text-base font-semibold text-white shadow-xl shadow-stone-900/10 transition hover:bg-black md:px-10"
                onClick={() => {
                  setCreatedUserId(null);
                  setShowAddToBusinessService(false);
                }}
              >
                <UserRoundPlus className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">Create Provider Account</span>
              </Button>
            </Modal.Open>
          </div>
        </div>

        <Modal.Body
          name="createServiceProviderAccount"
          hideDefaultClose
          className="w-full max-w-3xl rounded-[40px] bg-[#f7f7f7]"
        >
          <CreateProviderModalContent />
        </Modal.Body>

        {/* Search and Filter Section with proper spacing */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-[1fr_340px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search providers..."
              className="h-16 w-full rounded-3xl border border-stone-200 bg-white pl-14 pr-5 text-base text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            />
          </div>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <select
              className="h-16 w-full appearance-none rounded-3xl border border-stone-200 bg-white pl-12 pr-10 text-base font-semibold text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              value={selectedBusinessId}
              onChange={(e) => {
                setSelectedBusinessId(e.target.value);
                setSelectedServiceId("");
              }}
              disabled={isLoadingBusinesses}
            >
              <option value="">All businesses</option>
              {businesses.map((business: Business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-700"
            onClick={() => setShowServiceFilter((prev) => !prev)}
            title="Toggle service filter"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Service Filter with spacing */}
        {showServiceFilter && selectedBusinessId && (
          <div className="mb-8 max-w-md">
            {isLoadingServices ? (
              <div className="h-12 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
                Loading services...
              </div>
            ) : (
              <select
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">All services</option>
                {services.map((service: Service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Provider Cards Section */}
        {!selectedBusinessId ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-stone-200 bg-white p-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
              <Building2 className="h-8 w-8 text-stone-400" />
            </div>
            <p className="text-lg font-semibold text-stone-700">
              Select a business to view provider cards
            </p>
          </div>
        ) : isLoadingProviders ? (
          <div className="mt-8 py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-stone-700" />
            <p className="text-stone-600">Loading providers...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-stone-200 bg-white p-16 text-center">
            <p className="text-lg font-semibold text-stone-700">
              No providers found for this business
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 pb-10 md:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider: ServiceProvider) => (
              <article
                key={provider.id}
                className="relative rounded-[34px] border border-stone-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
              >
                {/* Profile Section with proper spacing */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="relative shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100 text-stone-500">
                      <UserRound className="h-10 w-10" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-300 transition hover:bg-stone-50 hover:text-stone-600"
                    aria-label="More options"
                  >
                    <Ellipsis className="h-5 w-5" />
                  </button>
                </div>

                {/* Name and Status */}
                <h3 className="mb-2 text-2xl font-bold leading-tight text-stone-900 md:text-[28px]">
                  {getProviderDisplayName(provider)}
                </h3>
                <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Active Provider
                </p>

                {/* Contact Information with proper spacing */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-stone-400" />
                    <span className="truncate text-sm font-medium text-stone-600">
                      {getProviderEmail(provider)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-stone-400" />
                    <span className="truncate text-sm font-medium text-stone-600">
                      {getProviderPhone(provider)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-6 h-px bg-stone-100" />

                {/* Assigned Units */}
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                  Assigned Units
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-semibold text-stone-600">
                    {getBusinessName(selectedBusinessId)}
                  </span>
                  <span className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-semibold text-stone-600">
                    {getServiceName(provider.serviceId)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Modal>
    </section>
  );
};
