"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";
import { LoginForm } from "@/components/auth";
import { PageLoader } from "@/components";

export default function ServiceProviderLoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      if (userRoles.includes("Service_Provider")) {
        router.replace("/service-provider/dashboard");
      } else {
        // User doesn't have Service_Provider role, redirect to general login
        router.replace("/auth/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  return (
    <LoginForm
      role="Service_Provider"
      title="Service Provider Login"
      subtitle="Sign in to access your service provider dashboard"
    />
  );
}
