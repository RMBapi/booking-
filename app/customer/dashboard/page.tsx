"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Calendar, User, X } from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { Card, PageLoader } from "@/components";
import { Button } from "@/components/buttons";
import { PageLayout, PageHeader, PageContent, Section, EmptyState } from "@/components/layout";

export default function CustomerDashboard() {
  const router = useRouter();
  const { getSession, logout: logoutRole, isLoading } = useRoleAuth();
  const customerSession = getSession("Customer");
  const { user, token } = customerSession;

  // Redirect to login if not logged in as customer
  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/auth/login/customer");
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
        title="Customer Dashboard"
        subtitle={`Welcome, ${user.firstName} ${user.lastName}`}
        icon={<ShoppingBag className="h-7 w-7 text-white" />}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              logoutRole("Customer");
              router.push("/auth/login/customer");
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
          <Section title="Quick Actions" subtitle="Get started with booking services">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <Card className="hover:shadow-md transition-shadow">
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <ShoppingBag className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Browse Businesses
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Explore businesses and book services online.
                    </p>
                  </div>
                  <Button className="w-full">Browse Now</Button>
                </div>
              </Card>

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
                description="Start booking services to see them here"
                action={
                  <Button size="lg">Browse Services</Button>
                }
              />
            </Card>
          </Section>
        </div>
      </PageContent>
    </PageLayout>
  );
}
