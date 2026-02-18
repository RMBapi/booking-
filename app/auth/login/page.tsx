"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";
import { Card, Button } from "@/components";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect when user is logged in
  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      // Redirect to first available role dashboard
      if (userRoles.includes("Super_Admin")) {
        router.replace("/super-admin");
      } else if (userRoles.includes("Business_owner")) {
        router.replace("/business-owner");
      } else if (userRoles.includes("Customer")) {
        router.replace("/customer/dashboard");
      } else if (userRoles.includes("Service_Provider")) {
        router.replace("/service-provider/dashboard");
      }
      // If user has no recognized role, don't redirect - stay on login page
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth or redirecting
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Choose your login portal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/auth/login/customer">
            <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Customer
              </h3>
              <p className="text-gray-600 text-sm">
                Access your bookings and manage your account
              </p>
            </div>
          </Link>

          <Link href="/auth/login/service-provider">
            <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Service Provider
              </h3>
              <p className="text-gray-600 text-sm">
                Manage your services and bookings
              </p>
            </div>
          </Link>

          <Link href="/auth/login/business-owner">
            <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Business Owner
              </h3>
              <p className="text-gray-600 text-sm">
                Manage your businesses and services
              </p>
            </div>
          </Link>

          <Link href="/auth/login/super-admin">
            <div className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Super Admin
              </h3>
              <p className="text-gray-600 text-sm">
                System administration and management
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <a
              href="/auth/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
