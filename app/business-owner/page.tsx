"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Plus, 
  Users, 
  Store, 
  Zap, 
  ArrowUpRight,
  LayoutGrid,
  List,
  Filter
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, PageLoader } from "@/components";
import {
  useCheckHasBusiness,
  CreateBusinessForm,
  useGetMyBusinesses,
  DashboardHeader,
  StatCard,
  EnhancedBusinessCard,
} from "@/features/business-owner";
import { motion, AnimatePresence } from "framer-motion";

const mockStatsData = {
  totalBusinesses: {
    title: 'Total Businesses',
    trend: '',
    trendType: 'up' as const,
    icon: Store,
    color: 'bg-stone-50',
    strokeColor: '#78716c',
    fillColor: '#78716c',
    data: [{ value: 10 }, { value: 15 }, { value: 8 }, { value: 22 }, { value: 18 }, { value: 25 }]
  },
  activeProviders: {
    title: 'Active Providers',
    value: '48',
    trend: '',
    trendType: 'up' as const,
    icon: Users,
    color: 'bg-teal-50',
    strokeColor: '#0d9488',
    fillColor: '#0d9488',
    data: [{ value: 20 }, { value: 25 }, { value: 30 }, { value: 28 }, { value: 35 }, { value: 48 }]
  },
  systemHealth: {
    title: 'System Health',
    value: 'Optimal',
    trend: 'Stable',
    trendType: 'neutral' as const,
    icon: Zap,
    color: 'bg-stone-50',
    strokeColor: '#a8a29e',
    fillColor: '#a8a29e',
    data: [{ value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }]
  }
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { businesses } = useGetMyBusinesses();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Redirect to login if not logged in as business owner
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/business-owner");
    }
  }, [token, isLoading, router]);

  // Show loading while checking auth
  if (isLoading || checkingBusiness) {
    return <PageLoader />;
  }

  // Don't render if not logged in
  if (!user || !token) {
    return null;
  }

  const handleCreateSuccess = (slug: string) => {
    setShowCreateModal(false);
    refetch();
    alert(
      `Business created successfully! Your business is now live at: /business/slug/${slug}`
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-sans text-stone-700 selection:bg-teal-100 selection:text-teal-900">
      <main className="flex flex-col min-w-0">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto py-8 md:py-10">
          <div className="bo-dashboard-shell space-y-12">
            
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
                    You haven&apos;t created a business profile yet. Let&apos;s get started and unlock all the powerful features to grow your business.
                  </p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
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
                <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl"
                  >
                    <h1 className="text-4xl font-semibold tracking-tight text-stone-800 md:text-5xl">
                      {getGreeting()}, {user.firstName}
                    </h1>
                    <p className="mt-3 text-base font-medium leading-relaxed text-stone-500 md:text-lg">
                      Take a moment to review your portfolio overview.
                    </p>
                  </motion.div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => router.push("/business-owner/providers")}
                      className="inline-flex h-11 items-center justify-center whitespace-nowrap gap-[10px] rounded-2xl border border-stone-200 bg-white px-6 text-sm font-semibold leading-none text-stone-600 shadow-sm transition-all duration-300 hover:bg-stone-50"
                    >
                      <Users className="w-4 h-4 opacity-70" />
                      Providers
                    </button>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex h-11 items-center justify-center whitespace-nowrap gap-[10px] rounded-2xl bg-teal-800 px-7 text-sm font-semibold leading-none text-stone-50 shadow-lg shadow-teal-900/10 transition-all duration-300 hover:bg-teal-900"
                    >
                      <Plus className="w-4 h-4" />
                      New Business
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <StatCard 
                    {...mockStatsData.totalBusinesses}
                    value={businesses.length.toString()}
                  />
                  <StatCard {...mockStatsData.activeProviders} />
                  <StatCard {...mockStatsData.systemHealth} />
                </div>

                {/* Content Controls */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-7 pt-4">
                  <div className="flex items-center gap-6">
                    <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-3">
                      My Businesses
                      <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-[11px] font-bold rounded-full border border-stone-200">
                        {businesses.length}
                      </span>
                    </h2>
                    <div className="flex items-center rounded-xl border border-stone-100 bg-stone-50 p-1.5 shadow-inner">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-teal-800 shadow-sm' : 'text-stone-300'}`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-teal-800 shadow-sm' : 'text-stone-300'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="inline-flex h-11 items-center justify-center whitespace-nowrap gap-[10px] rounded-2xl border border-stone-100 bg-white px-5 text-[13px] font-semibold leading-none text-stone-500 transition-all hover:bg-stone-50">
                      <Filter className="w-4 h-4 opacity-50" />
                      Refine
                    </button>
                  </div>
                </div>

                {/* Businesses Grid */}
                <div className="grid grid-cols-1 items-start gap-8 pb-20 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {businesses.map((business) => (
                      <EnhancedBusinessCard key={business.id} business={business} />
                    ))}
                  </AnimatePresence>
                  
                  {/* Empty State / Add New Placeholder */}
                  <motion.button 
                    whileHover={{ y: -2 }}
                    onClick={() => setShowCreateModal(true)}
                    className="group flex flex-col items-center justify-center p-10 border-2 border-dashed border-stone-200 rounded-[32px] hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-500 min-h-[440px]"
                  >
                    <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-100/50 transition-colors duration-500">
                      <Plus className="w-8 h-8 text-stone-300 group-hover:text-teal-600" />
                    </div>
                    <h3 className="text-stone-700 font-semibold text-lg">New Portfolio Item</h3>
                    <p className="text-stone-600 text-sm mt-2 text-center max-w-[220px] font-medium leading-relaxed">
                      Carefully add a new venture to your dashboard.
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-[11px] font-bold text-teal-700 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      Begin Setup <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Create Business Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl">Create Your Business Profile</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Fill in the details below to set up your business profile.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-6">
            <CreateBusinessForm onSuccess={handleCreateSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
