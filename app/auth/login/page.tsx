"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/contexts";
import { getRoleRedirectPath } from "@/lib";
import { PageLoader } from "@/components";

/**
 * Login landing — redirects to the customer login page.
 *
 * Since this is a customer-only public site, we redirect straight to
 * the customer login. If the user is already authenticated we send
 * them to the business homepage instead.
 */
export default function LoginPage() {
  const router = useRouter();
  const { getSession, isLoading } = useRoleAuth();

  useEffect(() => {
    if (isLoading) return;

    const { user, token } = getSession("Customer");
    if (user && token) {
      router.replace(getRoleRedirectPath("Customer"));
    } else {
      router.replace("/auth/login/customer");
    }
  }, [isLoading, getSession, router]);

  return <PageLoader />;
}
