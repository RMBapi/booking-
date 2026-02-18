"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else {
        // Redirect based on user roles (prioritize Super_Admin > Business_owner > Customer > Service_Provider)
        const userRoles = getUserRoles(user);
        if (userRoles.includes("Super_Admin")) {
          router.replace("/super-admin");
        } else if (userRoles.includes("Business_owner")) {
          router.replace("/business-owner");
        } else if (userRoles.includes("Customer")) {
          router.replace("/customer/dashboard");
        } else if (userRoles.includes("Service_Provider")) {
          router.replace("/service-provider/dashboard");
        } else {
          router.replace("/auth/login");
        }
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
