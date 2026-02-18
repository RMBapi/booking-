"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserPlus, AlertCircle, Info } from "lucide-react";
import { Input, Card, Select, PageLoader, Alert } from "@/components";
import { Button } from "@/components/buttons";
import { useRegister } from "@/features/authentication/hooks";
import { UserRole } from "@/types";

function RegisterContent() {
  const searchParams = useSearchParams();
  const { register, isRegistering } = useRegister();
  const [businessSiteSlug, setBusinessSiteSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "Customer" as UserRole,
  });

  // Extract businessSiteSlug from query params
  useEffect(() => {
    const slug = searchParams.get("businessSiteSlug") || searchParams.get("slug");
    setBusinessSiteSlug(slug);
    
    // If businessSiteSlug is present, automatically set role to Customer
    if (slug) {
      setFormData(prev => ({
        ...prev,
        role: "Customer" as UserRole,
      }));
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate businessSiteSlug for Customer role
    if (formData.role === "Customer" && !businessSiteSlug) {
      alert("Business site slug is required for customer registration. Please access this page from a business site.");
      return;
    }
    
    const payload = {
      ...formData,
      ...(formData.role === "Customer" && businessSiteSlug ? { businessSiteSlug } : {}),
    };
    
    register(payload);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md" padding="lg">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl shadow-lg">
            C
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {businessSiteSlug ? "Create Customer Account" : "Create Account"}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {businessSiteSlug 
              ? "Sign up to book services and manage your appointments" 
              : "Sign up to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
          />

          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+1234567890"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />

          {/* Only show role selector if NOT coming from a business site */}
          {!businessSiteSlug && (
            <Select
              label="I am a"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              options={[
                { value: "Customer", label: "Customer" },
                { value: "Service_Provider", label: "Service Provider" },
                { value: "Business_owner", label: "Business Owner" },
              ]}
            />
          )}

          {formData.role === "Customer" && !businessSiteSlug && (
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Customer registration requires a business site. Please access this page from a business site.
              </p>
            </Alert>
          )}

          {/* Show info badge when registering from business site */}
          {businessSiteSlug && (
            <Alert className="bg-primary-50 border-primary-200 text-primary-800">
              <Info className="h-4 w-4" />
              <p className="text-sm">
                You're creating a customer account for this business site.
              </p>
            </Alert>
          )}

          <Button 
            type="submit" 
            isLoading={isRegistering} 
            className="w-full"
            size="lg"
            disabled={formData.role === "Customer" && !businessSiteSlug}
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterContent />
    </Suspense>
  );
}
