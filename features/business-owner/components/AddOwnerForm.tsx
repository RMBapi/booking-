"use client";

import React, { useState } from "react";
import { Input, Button } from "@/components";
import { useAddBusinessOwner } from "../hooks";
import { useApiResponse } from "@/hooks";
import { AxiosError } from "axios";

interface AddOwnerFormProps {
  businessId: string;
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

export const AddOwnerForm: React.FC<AddOwnerFormProps> = ({
  businessId,
  onSuccess,
}) => {
  const { addBusinessOwner, isAdding } = useAddBusinessOwner();
  const { handleError } = useApiResponse();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(""); // Clear previous errors

    addBusinessOwner(businessId, email, {
      onSuccess: () => {
        setEmail("");
        setEmailError("");
        onSuccess?.();
      },
      onError: (error: Error) => {
        // Check if it's an API error
        if (error instanceof AxiosError) {
          const apiError = error.response?.data as ApiError;
          const errorMessage = Array.isArray(apiError?.message)
            ? apiError.message.join(", ")
            : apiError?.message || error.message;

          // Show error in form field for specific errors
          if (
            errorMessage.toLowerCase().includes("email") ||
            errorMessage.toLowerCase().includes("user") ||
            errorMessage.toLowerCase().includes("owner")
          ) {
            setEmailError(errorMessage);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> The person must first register as a Business Owner
          before you can add them as a co-owner to this business.
        </p>
      </div>

      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(""); // Clear error when user types
        }}
        placeholder="coowner@example.com"
        required
        error={emailError}
      />

      <Button type="submit" isLoading={isAdding} className="w-full">
        Add Co-Owner
      </Button>
    </form>
  );
};
