"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";
import { PageLoader } from "@/components";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once to prevent loops
    if (hasRedirected.current) return;

    if (!isLoading) {
      if (!user) {
        hasRedirected.current = true;
        router.replace("/auth/login");
      } else {
        // Get user role and redirect to appropriate dashboard
        const userRoles = getUserRoles(user);
        const userRole = userRoles[0];
        
        console.log("Dashboard fallback - redirecting based on role:", userRole);
        
        hasRedirected.current = true;
        switch (userRole) {
          case "Super_Admin":
            router.replace("/super-admin");
            break;
          case "Business_owner":
            router.replace("/business-owner");
            break;
          case "Customer":
            router.replace("/customer/dashboard");
            break;
          case "Service_Provider":
            router.replace("/service-provider/dashboard");
            break;
          default:
            console.error("Unknown role:", userRole);
            router.replace("/auth/login");
        }
      }
    }
  }, [user, isLoading, router]);

  return <PageLoader />;
}
