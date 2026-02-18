"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";
import { LoginForm } from "@/components/auth";
import { PageLoader } from "@/components";

export default function BusinessOwnerLoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      // Check if user has Business_owner role (including activeRole from backend)
      const hasBusinessOwnerRole = 
        userRoles.includes("Business_owner") || 
        (user as any).activeRole === "Business_owner";
      
      if (hasBusinessOwnerRole) {
        router.replace("/business-owner");
      } else if (userRoles.length > 0) {
        // User has other roles but not Business_owner, redirect to general login
        router.replace("/auth/login");
      }
      // If user has no roles, stay on page (will show login form)
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  return (
    <LoginForm
      role="Business_owner"
      title="Business Owner Login"
      subtitle="Sign in to access your business owner dashboard"
    />
  );
}
