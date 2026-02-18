"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { LoginForm } from "@/components/auth";
import { Card, PageLoader, Alert } from "@/components";
import { Button } from "@/components/buttons";

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSession, isLoading } = useRoleAuth();
  const [businessSiteSlug, setBusinessSiteSlug] = useState<string | null>(null);

  // Extract businessSiteSlug from query params
  useEffect(() => {
    const slug = searchParams.get("businessSiteSlug") || searchParams.get("slug");
    setBusinessSiteSlug(slug);
  }, [searchParams]);

  // Check if already logged in as customer
  useEffect(() => {
    if (!isLoading) {
      const { user, token } = getSession("Customer");
      
      if (user && token) {
        // User is already logged in as a customer - redirect to return URL or dashboard
        const returnUrl = searchParams.get("returnUrl");
        router.replace(returnUrl || "/customer/dashboard");
      }
    }
  }, [isLoading, getSession, router, searchParams]);

  if (isLoading) {
    return <PageLoader />;
  }

  // Show error if businessSiteSlug is missing for customer login
  if (!businessSiteSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center" padding="lg">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Business Site Required
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Customer login requires a business site. Please access this page from a business site or include the business site slug in the URL.
          </p>
          <Button onClick={() => router.push("/auth/login")} size="lg">
            <ArrowLeft className="h-4 w-4" />
            Go to Login Portal
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <LoginForm
        role="Customer"
        title="Customer Login"
        subtitle={`Sign in to book services${businessSiteSlug ? ` at ${businessSiteSlug}` : ""}`}
        businessSiteSlug={businessSiteSlug}
      />
      
      {/* Info message about independent sessions */}
      <div className="max-w-md mx-auto mt-6 px-4">
        <Alert className="bg-primary-50 border-primary-200 text-primary-800">
          <p className="text-sm">
            <strong>Note:</strong> Customer login is independent of other accounts. 
            You can be logged in as a customer and business owner simultaneously.
          </p>
        </Alert>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CustomerLoginContent />
    </Suspense>
  );
}
