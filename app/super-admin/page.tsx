"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, X, UserPlus } from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { Card, PageLoader, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components";
import { Button } from "@/components/buttons";
import { PageLayout, PageHeader, PageContent, Section } from "@/components/layout";
import {
  CreateBusinessOwnerForm,
  BusinessOwnerList,
} from "@/features/super-admin";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading } = useRoleAuth();
  const superAdminSession = getSession("Super_Admin");
  const { user, token } = superAdminSession;
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect to login if not logged in as super admin
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/super-admin");
    }
  }, [token, isLoading, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user || !token) {
    return null;
  }

  return (
    <PageLayout>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle={`Welcome, ${user.firstName} ${user.lastName}`}
        icon={<Shield className="h-7 w-7 text-white" />}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              logoutRole("Super_Admin");
              router.push("/auth/login/super-admin");
            }}
          >
            <X className="h-5 w-5" />
            Logout
          </Button>
        }
      />

      <PageContent>
        <Section
          title="Business Owners Management"
          subtitle="Create and manage business owner accounts"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus className="h-5 w-5" />
              Create Business Owner
            </Button>
          }
        >
          <Card>
            <BusinessOwnerList />
          </Card>
        </Section>
      </PageContent>

      {/* Create Business Owner Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl">Create Business Owner</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Add a new business owner to the platform.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-6">
            <CreateBusinessOwnerForm
              onSuccess={() => {
                setShowCreateModal(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
