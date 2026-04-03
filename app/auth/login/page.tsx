"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/contexts";

/**
 * Login landing — redirects to the customer login page.
 *
 * Since this is a customer-only public site, we redirect straight to
 * the customer login. If the user is already authenticated we send
 * them to the dashboard instead.
 */
export default function LoginPage() {
  const router = useRouter();
  const { getSession, isLoading } = useRoleAuth();

  useEffect(() => {
    if (isLoading) return;

    const { user, token } = getSession("Customer");
    if (user && token) {
      router.replace("/customer/dashboard");
    } else {
      router.replace("/auth/login/customer");
    }
  }, [isLoading, getSession, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent mx-auto" />
        <p className="mt-4 text-white/60">Loading...</p>
      </div>
    </div>
  );
}
