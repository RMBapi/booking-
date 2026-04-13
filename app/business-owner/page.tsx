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
                  <h2 className="text-xl font-semibold text-stone-800 mb-3">
                    Welcome to Your Dashboard!
                  </h2>
                  <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                    You haven&apos;t created a business profile yet. Let&apos;s
                    get started and unlock all the powerful features to grow
                    your business.
                  </p>
                  <button
                    onClick={() => setIsCreateBusinessOpen(true)}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap gap-2 px-5 bg-teal-800 text-white rounded-lg text-sm font-medium hover:bg-teal-900 transition-all mx-auto"
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
                    <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                      Welcome back, {user.firstName || "Alexander"}
                    </h1>
                    <p className="mt-1 max-w-lg text-sm text-stone-500">
                      Take a breath and review your portfolio overview.
                      Everything is running smoothly.
                    </p>
                  </motion.div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsCreateBusinessOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-[0.97]"
                    >
                      <Plus className="h-4 w-4" />
                      New Business
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <StatCard
                    {...mockStatsData.totalBusinesses}
                    value={businesses.length.toString()}
                  />
                  <StatCard {...mockStatsData.activeProviders} />
                </div>

                {/* Content Controls */}
                <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                      My Portfolio
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
                        {businesses.length}
                      </span>
                    </h2>
                    <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`rounded-md p-1.5 transition-all ${viewMode === "grid" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-500"}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`rounded-md p-1.5 transition-all ${viewMode === "list" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-500"}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-500 transition-all hover:bg-stone-50">
                      <Filter className="w-3.5 h-3.5 opacity-40" />
                      Refine View
                    </button>
                  </div>
                </div>

                {/* Businesses Grid */}
                <div className="grid grid-cols-1 gap-6 pb-16 md:grid-cols-2 lg:grid-cols-3">
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
                    whileHover={{ y: -2 }}
                    onClick={() => setIsCreateBusinessOpen(true)}
                    className="group flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 p-8 transition-all hover:border-stone-300 hover:bg-stone-50/40"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-50 transition-all group-hover:bg-white group-hover:shadow-md">
                      <Plus className="h-6 w-6 text-stone-300 transition-colors group-hover:text-stone-900" />
                    </div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      Expand Portfolio
                    </h3>
                    <p className="mt-2 max-w-[200px] text-center text-xs text-stone-400">
                      Ready to start a new venture? Add it to your dashboard
                      here.
                    </p>
                    <div className="mt-4 flex translate-y-2 items-center gap-1 text-xs font-medium uppercase tracking-wider text-stone-900 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      Get Started <ArrowUpRight className="h-3.5 w-3.5" />
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
