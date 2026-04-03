"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Users,
  Store,
  ArrowUpRight,
  LayoutGrid,
  List,
  Filter,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader } from "@/components";
import {
  useCheckHasBusiness,
  useCreateBusiness,
  useGetMyBusinesses,
  DashboardHeader,
  StatCard,
  EnhancedBusinessCard,
  CreateBusinessModal,
} from "@/features/business-owner";
import { motion, AnimatePresence } from "framer-motion";
import { CreateBusinessPayload } from "@/types";

const mockStatsData = {
  totalBusinesses: {
    title: "Total Businesses",
    trend: "Stable",
    trendType: "neutral" as const,
    icon: Store,
    color: "bg-stone-50",
    strokeColor: "#78716c",
    fillColor: "#0b0b0b",
    data: [
      { value: 10 },
      { value: 15 },
      { value: 8 },
      { value: 22 },
      { value: 18 },
      { value: 25 },
    ],
  },
  activeProviders: {
    title: "Active Providers",
    value: "48",
    trend: "Optimal",
    trendType: "up" as const,
    icon: Users,
    color: "bg-stone-50",
    strokeColor: "#8BA88E",
    fillColor: "#0b0b0b",
    data: [
      { value: 20 },
      { value: 25 },
      { value: 30 },
      { value: 28 },
      { value: 35 },
      { value: 48 },
    ],
  },
};

export default function BusinessOwnerDashboard() {
  const router = useRouter();
  const { getSession, isLoading } = useRoleAuth();
  const businessOwnerSession = getSession("Business_owner");
  const { user, token } = businessOwnerSession;

  const {
    hasBusiness,
    isLoading: checkingBusiness,
    refetch,
  } = useCheckHasBusiness();
  const [isCreateBusinessOpen, setIsCreateBusinessOpen] = useState(false);
  const { businesses, isLoading: loadingMyBusinesses } = useGetMyBusinesses();
  const { createBusiness, isCreating } = useCreateBusiness();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const soleBusinessId = businesses.length === 1 ? businesses[0].id : undefined;

  // Redirect to login if not logged in as business owner
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login");
    }
  }, [token, isLoading, router]);

  useEffect(() => {
    if (!hasBusiness || !soleBusinessId) return;
    router.replace(`/business-owner/${soleBusinessId}`);
  }, [hasBusiness, soleBusinessId, router]);

  // Show loading while checking auth; when owner has businesses, wait for list (redirect vs portfolio)
  if (isLoading || checkingBusiness || (hasBusiness && loadingMyBusinesses)) {
    return <PageLoader />;
  }

  // Don't render if not logged in
  if (!user || !token) {
    return null;
  }

  const handleCreateBusinessSubmit = (data: CreateBusinessPayload) => {
    createBusiness(data, {
      onSuccess: (response) => {
        const created = response.data.data;
        setIsCreateBusinessOpen(false);
        refetch();
        if (created?.id) {
          router.replace(`/business-owner/${created.id}`);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-stone-900 selection:bg-stone-900 selection:text-white">
      <main className="flex flex-col min-w-0">
        <DashboardHeader />

        <div className="flex-1 overflow-y-auto">
          <div className="bo-dashboard-shell section-stack py-8 md:py-10">
            {!hasBusiness ? (
              /* Empty State */
              <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-md"
                >
                  <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-primary-600" />
                  </div>
                  <h2 className="text-3xl font-semibold text-stone-800 mb-4">
                    Welcome to Your Dashboard!
                  </h2>
                  <p className="text-stone-500 mb-8 leading-relaxed">
                    You haven&apos;t created a business profile yet. Let&apos;s
                    get started and unlock all the powerful features to grow
                    your business.
                  </p>
                  <button
                    onClick={() => setIsCreateBusinessOpen(true)}
                    className="inline-flex h-12 items-center justify-center whitespace-nowrap leading-none gap-[10px] px-8 py-[14px] bg-teal-800 text-stone-50 rounded-xl text-sm font-bold hover:bg-teal-900 transition-all duration-300 shadow-lg shadow-teal-900/10 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Business Profile
                  </button>
                </motion.div>
              </div>
            ) : (
              <>
                {/* Hero Section */}
                <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <h1 className="text-5xl font-semibold tracking-tight text-stone-900">
                      Welcome back, {user.firstName || "Alexander"}
                    </h1>
                    <p className="mt-4 max-w-lg text-lg font-medium leading-relaxed text-stone-500">
                      Take a breath and review your portfolio overview.
                      Everything is running smoothly.
                    </p>
                  </motion.div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsCreateBusinessOpen(true)}
                      className="inline-flex h-14 min-w-[176px] items-center justify-center gap-3 whitespace-nowrap rounded-[24px] bg-stone-900 px-8 text-[14px] font-bold leading-none text-white shadow-xl shadow-stone-900/20 transition-all duration-300 hover:bg-stone-800 active:scale-95"
                    >
                      <Plus className="h-5 w-5" />
                      New Business
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                  <StatCard
                    {...mockStatsData.totalBusinesses}
                    value={businesses.length.toString()}
                  />
                  <StatCard {...mockStatsData.activeProviders} />
                </div>

                {/* Content Controls */}
                <div className="flex items-center justify-between border-b border-stone-100/80 pb-8">
                  <div className="flex items-center gap-10">
                    <h2 className="flex items-center gap-4 text-2xl font-semibold text-stone-900">
                      My Portfolio
                      <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[12px] font-bold text-stone-500 shadow-inner">
                        {businesses.length}
                      </span>
                    </h2>
                    <div className="flex items-center rounded-2xl border border-stone-100/50 bg-stone-50 p-1.5 shadow-inner">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`rounded-xl p-2.5 transition-all duration-500 ${viewMode === "grid" ? "bg-white text-stone-900 shadow-md" : "text-stone-300 hover:text-stone-400"}`}
                      >
                        <LayoutGrid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`rounded-xl p-2.5 transition-all duration-500 ${viewMode === "list" ? "bg-white text-stone-900 shadow-md" : "text-stone-300 hover:text-stone-400"}`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="inline-flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-2xl border border-stone-100 bg-white px-5 text-[14px] font-bold leading-none text-stone-500 transition-all hover:bg-stone-50 active:scale-95">
                      <Filter className="w-4 h-4 opacity-40" />
                      Refine View
                    </button>
                  </div>
                </div>

                {/* Businesses Grid */}
                <div className="grid grid-cols-1 gap-10 pb-32 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {businesses.map((business) => (
                      <EnhancedBusinessCard
                        key={business.id}
                        business={business}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Empty State / Add New Placeholder */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setIsCreateBusinessOpen(true)}
                    className="group flex min-h-[480px] flex-col items-center justify-center rounded-[48px] border-2 border-dashed border-stone-200 p-12 transition-all duration-700 hover:border-stone-400 hover:bg-stone-50/40"
                  >
                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-50 transition-all duration-700 group-hover:bg-white group-hover:shadow-xl">
                      <Plus className="h-10 w-10 text-stone-300 transition-colors group-hover:text-stone-900" />
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900">
                      Expand Portfolio
                    </h3>
                    <p className="mt-4 max-w-[240px] text-center text-[15px] font-medium leading-relaxed text-stone-400">
                      Ready to start a new venture? Add it to your dashboard
                      here.
                    </p>
                    <div className="mt-10 flex translate-y-4 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.3em] text-stone-900 opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
                      Get Started <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <CreateBusinessModal
        isOpen={isCreateBusinessOpen}
        onClose={() => setIsCreateBusinessOpen(false)}
        onSubmit={handleCreateBusinessSubmit}
        isSubmitting={isCreating}
      />
    </div>
  );
}
