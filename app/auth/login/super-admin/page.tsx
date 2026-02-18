"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";
import { getUserRoles } from "@/utils";
import { LoginForm } from "@/components/auth";
import { PageLoader } from "@/components";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const userRoles = getUserRoles(user);
      if (userRoles.includes("Super_Admin")) {
        router.replace("/super-admin");
      } else {
        // User doesn't have Super_Admin role, redirect to general login
        router.replace("/auth/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  return (
    <LoginForm
      role="Super_Admin"
      title="Super Admin Login"
      subtitle="Sign in to access the admin dashboard"
    />
  );
}
