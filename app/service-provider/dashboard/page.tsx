"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Calendar, User, X } from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { Card, PageLoader } from "@/components";
import { Button } from "@/components/buttons";
import { PageLayout, PageHeader, PageContent, Section, EmptyState } from "@/components/layout";

export default function ServiceProviderDashboard() {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading } = useRoleAuth();
  const serviceProviderSession = getSession("Service_Provider");
  const { user, token } = serviceProviderSession;

  // Redirect to login if not logged in as service provider
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/service-provider");
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
        title="Service Provider Dashboard"
        subtitle={`Welcome, ${user.firstName} ${user.lastName}`}
        icon={<Briefcase className="h-7 w-7 text-white" />}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              logoutRole("Service_Provider");
              router.push("/auth/login/service-provider");
            }}
          >
            <X className="h-5 w-5" />
            Logout
          </Button>
        }
      />

      <PageContent>
        <div className="space-y-8 w-full">
          {/* Quick Actions */}
          <Section title="Quick Actions" subtitle="Manage your services and bookings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <Card className="hover:shadow-md transition-shadow">
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      My Bookings
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Check your upcoming and past bookings.
                    </p>
                  </div>
                  <Button className="w-full">View Bookings</Button>
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <Briefcase className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      My Services
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      View and update your service offerings.
                    </p>
                  </div>
                  <Button className="w-full">Manage Services</Button>
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      My Profile
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Manage your account settings and preferences.
                    </p>
                  </div>
                  <Button className="w-full">Edit Profile</Button>
                </div>
              </Card>
            </div>
          </Section>

          {/* Recent Bookings Section */}
          <Section title="Recent Bookings" className="mt-10">
            <Card>
              <EmptyState
                icon={<Calendar className="h-10 w-10 text-gray-400" />}
                title="No bookings yet"
                description="Bookings will appear here when customers book your services"
                action={
                  <Button size="lg">View All Bookings</Button>
                }
              />
            </Card>
          </Section>
        </div>
      </PageContent>
    </PageLayout>
  );
}
