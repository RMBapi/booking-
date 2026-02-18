"use client";

import React, { useState } from "react";
import { LogIn, User } from "lucide-react";
import { Input, Card, Label } from "@/components";
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
  const { login, isLogging } = useLogin();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate businessSiteSlug for Customer role
    if (role === "Customer" && !businessSiteSlug) {
      alert("Business site slug is required for customer login. Please access this page from a business site.");
      return;
    }
    
    login({
      ...formData,
      role,
      ...(role === "Customer" && businessSiteSlug ? { businessSiteSlug } : {}),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12 w-full">
      <Card className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 text-white font-bold text-3xl shadow-lg">
            C
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
          {role && (
            <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-primary-100 text-sm text-primary-700 font-medium">
              <User className="w-4 h-4" />
              {role.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
            Don't have an account?{" "}
            <a
              href={role === "Customer" && businessSiteSlug 
                ? `/auth/register?businessSiteSlug=${encodeURIComponent(businessSiteSlug)}`
                : "/auth/register"}
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Other Options Link */}
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-gray-600">
            Need to login as a different role?{" "}
            <a
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View all options
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};
