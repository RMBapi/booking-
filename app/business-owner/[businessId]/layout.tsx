"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useRoleAuth } from "@/contexts";
import { useCreateBusiness, useGetMyBusinesses } from "@/features/business-owner";
import { DashboardSidebar } from "@/features/business-owner/components/dashboard/DashboardSidebar";
import { AddProviderModal } from "@/features/business-owner/components/dashboard/AddProviderModal";
import { AddServiceModal } from "@/features/business-owner/components/dashboard/AddServiceModal";
import { CreateBusinessModal } from "@/features/business-owner/components/CreateBusinessModal";
import { PageLoader } from "@/components";
import { Business, CreateBusinessPayload } from "@/types";

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  const { getSession, isLoading: authLoading } = useRoleAuth();
  const session = getSession("Business_owner");
  const { user, token } = session;

  const { businesses, isLoading: loadingBusinesses } = useGetMyBusinesses();
  const currentBusiness = businesses.find((b) => b.id === businessId);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isCreateBusinessOpen, setIsCreateBusinessOpen] = useState(false);
  const { createBusiness, isCreating } = useCreateBusiness();

  const buildNextPath = useMemo(() => {
    return (nextBusinessId: string) => {
      const basePrefix = `/business-owner/${businessId}`;
      if (pathname.startsWith(basePrefix)) {
        return pathname.replace(basePrefix, `/business-owner/${nextBusinessId}`);
      }
      return `/business-owner/${nextBusinessId}`;
    };
  }, [businessId, pathname]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth/login");
    }
  }, [authLoading, token, router]);

  if (authLoading || loadingBusinesses) {
    return <PageLoader />;
  }

  if (!user || !token) {
    return null;
  }

  const handleBusinessChange = (business: Business) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("currentBusinessId", business.id);
    }
    router.replace(buildNextPath(business.id));
  };

  const handleCreateBusinessSubmit = (data: CreateBusinessPayload) => {
    createBusiness(data, {
      onSuccess: (response) => {
        const created = response.data.data;
        setIsCreateBusinessOpen(false);
        if (created?.id) {
          router.replace(`/business-owner/${created.id}`);
        }
      },
    });
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] overflow-hidden">
      <DashboardSidebar
        businessId={businessId}
        businessName={currentBusiness?.name ?? "My Business"}
        businessSlug={currentBusiness?.slug ?? ""}
        userName={
          user.firstName
            ? `${user.firstName} ${user.lastName ?? ""}`.trim()
            : "Business Owner"
        }
        businesses={businesses}
        currentBusiness={currentBusiness ?? businesses[0]}
        onBusinessChange={handleBusinessChange}
        onCreateBusiness={() => setIsCreateBusinessOpen(true)}
        onAddService={() => setIsAddServiceOpen(true)}
        onAddProvider={() => setIsAddProviderOpen(true)}
        onLogout={() => {
          router.replace("/auth/login");
        }}
      />

      <main className="flex-1 overflow-y-auto lg:pt-0 pt-20">{children}</main>

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        businessId={businessId}
      />

      <AddProviderModal
        isOpen={isAddProviderOpen}
        onClose={() => setIsAddProviderOpen(false)}
        businessId={businessId}
      />

      <CreateBusinessModal
        isOpen={isCreateBusinessOpen}
        onClose={() => setIsCreateBusinessOpen(false)}
        onSubmit={handleCreateBusinessSubmit}
        isSubmitting={isCreating}
      />
    </div>
  );
}
