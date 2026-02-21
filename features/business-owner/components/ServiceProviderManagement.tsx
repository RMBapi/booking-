"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components";
import { useApiResponse } from "@/hooks";
import {
  useGetMyBusinesses,
  useBusinessServices,
  useServiceProviders,
  useCreateServiceProviderAccount,
} from "../hooks";
import { Business, Service, ServiceProvider } from "@/types";
import {
  ChevronLeft,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  X,
  CheckCircle2,
  User,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

type ModalStep = 1 | 2 | 3;

export const ServiceProviderManagement: React.FC = () => {
  const router = useRouter();
  const { handleSuccess } = useApiResponse();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [showServiceFilter, setShowServiceFilter] = useState(false);

  const [modalStep, setModalStep] = useState<ModalStep>(1);
  const [createdUserId, setCreatedUserId] = useState<string>("");
  const [accountError, setAccountError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    businessId: "",
    serviceId: "",
    description: "",
  });

  const { businesses, isLoading: isLoadingBusinesses } = useGetMyBusinesses();
  const { services: selectedBusinessServices, isLoading: isLoadingServices } = useBusinessServices(
    selectedBusinessId || null,
    { page: 1, limit: 100 }
  );
  const { providers, isLoading: isLoadingProviders } = useServiceProviders(selectedBusinessId || null, {
    page: 1,
    limit: 100,
    serviceId: selectedServiceId || undefined,
    search: searchQuery || undefined,
  });

  const { services: assignServices, isLoading: isLoadingAssignServices } = useBusinessServices(
    assignmentForm.businessId || null,
    { page: 1, limit: 100 }
  );
  const { createServiceProvider: assignProviderToBusiness, isCreating: isAssigningProvider } = useServiceProviders(
    assignmentForm.businessId || null,
    { page: 1, limit: 10 }
  );
  const { createServiceProviderAccount, isCreating: isCreatingAccount } = useCreateServiceProviderAccount();

  useEffect(() => {
    setSelectedServiceId("");
  }, [selectedBusinessId]);

  useEffect(() => {
    setAssignmentForm((prev) => ({ ...prev, serviceId: "" }));
  }, [assignmentForm.businessId]);

  const businessMap = useMemo(() => {
    const map = new Map<string, string>();
    businesses.forEach((b: Business) => map.set(b.id, b.name));
    return map;
  }, [businesses]);

  const serviceMap = useMemo(() => {
    const map = new Map<string, string>();
    selectedBusinessServices.forEach((s: Service) => map.set(s.id, s.name));
    return map;
  }, [selectedBusinessServices]);

  const currentBusinessName = selectedBusinessId ? businessMap.get(selectedBusinessId) || "Business" : "Business";
  const createdBusinessName =
    assignmentForm.businessId && businessMap.get(assignmentForm.businessId)
      ? businessMap.get(assignmentForm.businessId)!
      : currentBusinessName;

  const getProviderDisplayName = (provider: ServiceProvider) => {
    const providerWithUser = provider as ServiceProvider & {
      user?: { firstName?: string; lastName?: string; email?: string; phone?: string };
    };

    if (providerWithUser.user?.firstName && providerWithUser.user?.lastName) {
      return `${providerWithUser.user.firstName} ${providerWithUser.user.lastName}`;
    }

    if (providerWithUser.user?.email) {
      const local = providerWithUser.user.email.split("@")[0];
      return local
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }

    return `Provider ${provider.userId.slice(0, 6)}`;
  };

  const getProviderEmail = (provider: ServiceProvider) => {
    const providerWithUser = provider as ServiceProvider & { user?: { email?: string } };
    return providerWithUser.user?.email || "No email provided";
  };

  const getProviderPhone = (provider: ServiceProvider) => {
    const providerWithUser = provider as ServiceProvider & { user?: { phone?: string } };
    return providerWithUser.user?.phone || provider.description || "No phone information";
  };

  const resetModalState = () => {
    setModalStep(1);
    setCreatedUserId("");
    setAccountError("");
    setAssignmentError("");
    setAccountForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setAssignmentForm({
      businessId: selectedBusinessId || "",
      serviceId: "",
      description: "",
    });
  };

  const openCreateProviderModal = () => {
    resetModalState();
  };

  const closeCreateProviderModal = () => resetModalState();

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");

    if (accountForm.password !== accountForm.confirmPassword) {
      setAccountError("Passwords do not match.");
      return;
    }

    if (accountForm.password.length < 8) {
      setAccountError("Password must be at least 8 characters.");
      return;
    }

    createServiceProviderAccount(
      {
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        email: accountForm.email,
        phone: accountForm.phone,
        password: accountForm.password,
      },
      {
        onSuccess: (response) => {
          setCreatedUserId(response.data.user.id);
          setModalStep(2);
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setAccountError(err.response?.data?.message || err.message || "Failed to create provider account.");
        },
      }
    );
  };

  const handleAssignBusiness = () => {
    setAssignmentError("");

    if (!assignmentForm.businessId || !assignmentForm.serviceId || !createdUserId) {
      setAssignmentError("Please select both business and service.");
      return;
    }

    assignProviderToBusiness(
      {
        serviceId: assignmentForm.serviceId,
        userId: createdUserId,
        description: assignmentForm.description || undefined,
      },
      {
        onSuccess: () => {
          setModalStep(3);
          handleSuccess("Provider account created and assigned!");
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setAssignmentError(err.response?.data?.message || err.message || "Failed to assign provider.");
        },
      }
    );
  };

  return (
    <section className="bo-dashboard-shell py-10">
      <Modal>
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              type="button"
              onClick={() => router.push("/business-owner")}
              className="group mb-6 flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors font-bold text-xs uppercase tracking-[0.2em]"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Dashboard
            </button>
            <h1 className="text-5xl font-semibold tracking-tight text-stone-900">Service Providers</h1>
            <p className="text-stone-500 mt-4 text-lg font-medium">Manage your team members and their assignments.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Modal.Open opens="createServiceProviderAccount">
              <button
                type="button"
                onClick={openCreateProviderModal}
                className="flex items-center gap-3 px-8 py-5 bg-stone-900 text-white rounded-[24px] text-[15px] font-bold shadow-xl shadow-stone-900/20"
              >
                <UserPlus className="h-5 w-5" />
                Create Provider Account
              </button>
            </Modal.Open>
          </motion.div>
        </div>

        <div className="mb-10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
              <select
                value={selectedBusinessId}
                onChange={(e) => {
                  setSelectedBusinessId(e.target.value);
                  setSelectedServiceId("");
                }}
                disabled={isLoadingBusinesses}
                className="w-full md:w-64 pl-11 pr-5 py-4 bg-white border border-stone-200 rounded-2xl text-stone-600 font-bold text-[13px] appearance-none focus:outline-none cursor-pointer shadow-sm"
              >
                <option value="">{isLoadingBusinesses ? "Loading..." : "All Businesses"}</option>
                {businesses.map((b: Business) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowServiceFilter((prev) => !prev)}
              className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-500 hover:text-stone-900 transition-colors shadow-sm"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showServiceFilter && selectedBusinessId && (
          <div className="mb-8 max-w-sm">
            {isLoadingServices ? (
              <div className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm text-stone-500">
                Loading services...
              </div>
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm text-stone-700 font-medium focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all"
              >
                <option value="">All Services</option>
                {selectedBusinessServices.map((service: Service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {!selectedBusinessId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-stone-50/50 rounded-[48px] border border-dashed border-stone-200"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
              <Building2 className="h-10 w-10 text-stone-200" />
            </div>
            <h3 className="text-2xl font-semibold text-stone-900">Select a business first</h3>
            <p className="text-stone-500 mt-3 max-w-sm font-medium leading-relaxed">
              Choose a business from the filter to view and manage provider assignments.
            </p>
          </motion.div>
        ) : isLoadingProviders ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-stone-700 mb-4" />
            <p className="text-stone-500 font-medium">Loading providers...</p>
          </div>
        ) : providers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-stone-50/50 rounded-[48px] border border-dashed border-stone-200"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
              <User className="h-10 w-10 text-stone-200" />
            </div>
            <h3 className="text-2xl font-semibold text-stone-900">No providers found</h3>
            <p className="text-stone-500 mt-3 max-w-sm font-medium leading-relaxed">
              We couldn&apos;t find team members matching your selection. Adjust filters or create a new account.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {providers.map((provider: ServiceProvider) => (
              <motion.article
                key={provider.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-900/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-stone-50 shadow-inner bg-stone-100 flex items-center justify-center text-stone-300">
                      <User className="h-8 w-8" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center bg-[#8BA88E] text-white">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <button type="button" className="p-2 text-stone-300 hover:text-stone-900 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{getProviderDisplayName(provider)}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-[#8BA88E]">Active Provider</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-stone-500">
                      <Mail className="h-4 w-4 opacity-50" />
                      <span className="text-sm font-medium truncate">{getProviderEmail(provider)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500">
                      <Phone className="h-4 w-4 opacity-50" />
                      <span className="text-sm font-medium truncate">{getProviderPhone(provider)}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-50">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Assigned Units</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-stone-50 text-stone-600 rounded-lg text-[11px] font-bold border border-stone-100">
                        {currentBusinessName}
                      </span>
                      <span className="px-3 py-1 bg-stone-50 text-stone-600 rounded-lg text-[11px] font-bold border border-stone-100">
                        {serviceMap.get(provider.serviceId) || "Service"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <Modal.Body
          name="createServiceProviderAccount"
          hideDefaultClose
          className="w-full max-w-[760px] bg-[#F7F6F4] dark:bg-[#F7F6F4] border border-stone-200/80 rounded-[44px] overflow-hidden p-0 shadow-[0_35px_80px_rgba(0,0,0,0.22)]"
        >
          <div className="px-8 py-10 md:px-12 md:py-12">
            <div className="pb-0 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white">
                  {modalStep === 1 ? (
                    <UserPlus className="h-6 w-6" />
                  ) : modalStep === 2 ? (
                    <Building2 className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
                    {modalStep === 1 ? "Create Account" : modalStep === 2 ? "Assign Business" : "Success"}
                  </h2>
                  <p className="text-stone-500 text-sm font-medium">Step {modalStep} of 2</p>
                </div>
              </div>
              <Modal.Close>
                <button
                  type="button"
                  onClick={closeCreateProviderModal}
                  className="p-3 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-400 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </Modal.Close>
            </div>

            <div className="pt-16">
              {modalStep === 1 && (
                <form onSubmit={handleCreateAccount} className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">First Name</label>
                      <input
                        required
                        type="text"
                        value={accountForm.firstName}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="h-14 w-full px-5 bg-transparent border border-stone-300/80 rounded-[16px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Last Name</label>
                      <input
                        required
                        type="text"
                        value={accountForm.lastName}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="h-14 w-full px-5 bg-transparent border border-stone-300/80 rounded-[16px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <input
                        required
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-14 w-full pl-12 pr-5 bg-transparent border border-stone-300/80 rounded-[16px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <input
                        required
                        type="tel"
                        value={accountForm.phone}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="h-14 w-full pl-12 pr-5 bg-transparent border border-stone-300/80 rounded-[16px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <input
                          required
                          type="password"
                          value={accountForm.password}
                          onChange={(e) => setAccountForm((prev) => ({ ...prev, password: e.target.value }))}
                          className="h-14 w-full pl-12 pr-5 bg-transparent border border-stone-300/80 rounded-[16px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">Confirm Password</label>
                      <input
                        required
                        type="password"
                        value={accountForm.confirmPassword}
                        onChange={(e) => setAccountForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="h-14 w-full px-5 bg-transparent border border-stone-300/80 rounded-[16px] text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {accountError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {accountError}
                    </div>
                  )}

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isCreatingAccount}
                      className="h-16 w-full bg-stone-900 text-white rounded-[18px] text-[15px] font-bold hover:bg-stone-800 transition-all shadow-[0_14px_30px_rgba(24,20,20,0.18)] flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {isCreatingAccount ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Provider Account
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {modalStep === 2 && (
                <div className="space-y-8">
                  <div className="bg-[#8BA88E]/10 border border-[#8BA88E]/20 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#8BA88E] shadow-sm">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">Account Created Successfully!</p>
                      <p className="text-xs text-stone-500 font-medium italic">
                        Now assign this provider to a business unit.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Select Business *</label>
                      <div className="relative">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                        <select
                          value={assignmentForm.businessId}
                          onChange={(e) => setAssignmentForm((prev) => ({ ...prev, businessId: e.target.value }))}
                          className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium appearance-none cursor-pointer"
                        >
                          <option value="">-- Choose Business --</option>
                          {businesses.map((b: Business) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Select Service *</label>
                      {assignmentForm.businessId && isLoadingAssignServices ? (
                        <div className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl text-sm text-stone-500">
                          Loading services...
                        </div>
                      ) : (
                        <select
                          value={assignmentForm.serviceId}
                          onChange={(e) => setAssignmentForm((prev) => ({ ...prev, serviceId: e.target.value }))}
                          className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium appearance-none cursor-pointer"
                        >
                          <option value="">-- Choose Service --</option>
                          {assignServices.map((s: Service) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Provider Description (Optional)</label>
                      <textarea
                        rows={4}
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the provider's expertise or role..."
                        className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium resize-none"
                      />
                    </div>
                  </div>

                  {assignmentError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {assignmentError}
                    </div>
                  )}

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-8 py-5 bg-stone-50 text-stone-500 rounded-2xl text-[15px] font-bold hover:bg-stone-100 transition-all"
                    >
                      Edit Account
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignBusiness}
                      disabled={!assignmentForm.businessId || !assignmentForm.serviceId || isAssigningProvider}
                      className="flex-1 py-5 bg-stone-900 text-white rounded-2xl text-[15px] font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isAssigningProvider ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Confirm & Add Provider
                          <CheckCircle2 className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-12">
                  <div className="w-24 h-24 bg-[#8BA88E] rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-[#8BA88E]/20 mx-auto">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-semibold text-stone-900 tracking-tight">Onboarding Complete</h2>
                    <p className="text-stone-500 font-medium max-w-sm mx-auto leading-relaxed">
                      <strong>{accountForm.firstName} {accountForm.lastName}</strong> has been successfully added to{" "}
                      <strong>{createdBusinessName}</strong>.
                    </p>
                  </div>
                  <Modal.Close>
                    <button
                      type="button"
                      onClick={closeCreateProviderModal}
                      className="px-12 py-5 bg-stone-900 text-white rounded-2xl text-[15px] font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10"
                    >
                      Return to Team List
                    </button>
                  </Modal.Close>
                </motion.div>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </section>
  );
};
