"use client";

import React, { useState } from "react";
import { Input, Button } from "@/components";
import { useCreateBusinessOwner } from "../hooks";
import { useApiResponse } from "@/hooks";
import { CreateBusinessOwnerPayload } from "@/types";
import { AxiosError } from "axios";

interface CreateBusinessOwnerFormProps {
  onSuccess?: () => void;
}

type ApiError = {
  error?: {
    httpReasonPhrase?: string;
    httpStatusCode?: number;
  };
  message?: string | string[];
  statusCode?: number;
};

export const CreateBusinessOwnerForm: React.FC<CreateBusinessOwnerFormProps> = ({
  onSuccess,
}) => {
  const { createBusinessOwner, isCreating } = useCreateBusinessOwner();
  const { handleError } = useApiResponse();
  const [formData, setFormData] = useState<CreateBusinessOwnerPayload>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [emailError, setEmailError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(""); // Clear previous errors
    createBusinessOwner(formData, {
      onSuccess: () => {
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
        });
        setEmailError("");
        onSuccess?.();
      },
      onError: (error: Error) => {
        // Check if it's an email registration error
        if (error instanceof AxiosError) {
          const apiError = error.response?.data as ApiError;
          const errorMessage = Array.isArray(apiError?.message)
            ? apiError.message.join(", ")
            : apiError?.message || error.message;

          // Check if error is about email being registered
          if (
            errorMessage.toLowerCase().includes("email") &&
            (errorMessage.toLowerCase().includes("registered") ||
              errorMessage.toLowerCase().includes("already exists") ||
              errorMessage.toLowerCase().includes("already in use"))
          ) {
            // Show error in form field instead of toast
            setEmailError(
              "This email is already registered. Please use a different email address."
            );
          } else {
            // For other errors, show toast notification
            handleError(error);
          }
        } else {
          // For non-Axios errors, show toast
          handleError(error);
        }
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        autoComplete="off"
        onChange={(e) => {
          handleChange(e);
          setEmailError(""); // Clear error when user types
        }}
        required
        error={emailError}
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
        autoComplete="new-password"
        onChange={handleChange}
        required
        minLength={6}
      />

      <Button type="submit" isLoading={isCreating} className="w-full">
        Create Business Owner
      </Button>
    </form>
  );
};
