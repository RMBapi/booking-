"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogIn, ShieldCheck, User } from "lucide-react";
import { Alert, Input, Card } from "@/components";
import { Button } from "@/components/buttons";
import { useLogin } from "@/features/authentication/hooks";
import { UserRole } from "@/types";

interface LoginFormProps {
  // Role is required and will be sent to the backend in the login request.
  // The backend will validate that the user has this role.
  role: UserRole;
  title?: string;
  subtitle?: string;
  /**
   * Required when role === "Customer"
   * Identifies which business site the customer belongs to
   * Should be extracted from URL or context
   */
  businessSiteSlug?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  role,
  title = "Welcome Back",
  subtitle = "Sign in to your account",
  businessSiteSlug,
}) => {
  const { login, isLogging, errorMessage, clearError } = useLogin();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate businessSiteSlug for Customer role
    if (role === "Customer" && !businessSiteSlug) {
      setFormError(
        "Customer login requires a valid business site. Please open this page from a business site URL."
      );
      return;
    }
    
    clearError();
    login({
      ...formData,
      role,
      ...(role === "Customer" && businessSiteSlug ? { businessSiteSlug } : {}),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formError) {
      setFormError(null);
    }
    if (errorMessage) {
      clearError();
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,#dff1f7_0%,#eef3f6_45%,#f8fafc_100%)] px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto w-full max-w-lg">
        <Card className="w-full border border-white/60 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur" padding="lg">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-sky-800 text-3xl font-bold text-white shadow-xl shadow-primary-900/20">
            C
          </div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
          {role && (
            <div className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
              <User className="h-4 w-4" />
              {role.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
          {formError && (
            <Alert variant="warning" title="Missing Business Context">
              {formError}
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="danger" title="Login Failed">
              {errorMessage}
            </Alert>
          )}

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
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />

          <Button 
            type="submit" 
            isLoading={isLogging} 
            className="w-full" 
            size="lg"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Do not have an account?{" "}
            <Link
              href={
                role === "Customer" && businessSiteSlug
                  ? `/auth/register?businessSiteSlug=${encodeURIComponent(businessSiteSlug)}`
                  : "/auth/register"
              }
              className="font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Other Options Link */}
        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="h-4 w-4 text-primary-600" />
            Need a different role?
            <Link href="/auth/login" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
              View all options
            </Link>
          </p>
        </div>
      </Card>
      </div>
    </div>
  );
};
