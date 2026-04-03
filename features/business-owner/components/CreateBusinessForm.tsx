"use client";

import React, { useState } from "react";
import { Building2, Save } from "lucide-react";
import { Input, TextArea, Label } from "@/components";
import { Button } from "@/components/buttons";
import { useCreateBusiness } from "../hooks";
import { CreateBusinessPayload } from "@/types";

interface CreateBusinessFormProps {
  onSuccess?: (slug: string) => void;
}

export const CreateBusinessForm: React.FC<CreateBusinessFormProps> = ({
  onSuccess,
}) => {
  const { createBusiness, isCreating } = useCreateBusiness();
  const [formData, setFormData] = useState<CreateBusinessPayload>({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBusiness(formData, {
      onSuccess: (response) => {
        const slug = response.data.data.slug;
        onSuccess?.(slug);
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Input
          label="Business Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Acme Salon & Spa"
        />
        <p className="text-sm text-gray-600 pl-1">
          Your website URL will be based on this name
        </p>
      </div>

      <TextArea
        label="Description"
        name="description"
        value={formData.description || ""}
        onChange={handleChange}
        placeholder="Brief description of your business"
        rows={4}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Business Email"
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          placeholder="contact@yourbusiness.com"
        />

        <Input
          label="Business Phone"
          type="tel"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          placeholder="+1234567890"
        />
      </div>

      <Input
        label="Business Address"
        name="address"
        value={formData.address || ""}
        onChange={handleChange}
        placeholder="123 Main St, City, State, ZIP"
      />

      <Input
        label="Logo URL"
        type="url"
        name="logoUrl"
        value={formData.logoUrl || ""}
        onChange={handleChange}
        placeholder="https://example.com/logo.png"
        helperText="Optional: Provide a link to your business logo"
      />

      <Button type="submit" isLoading={isCreating} className="w-full" size="lg">
        <Save className="h-5 w-5" />
        Create Business Profile
      </Button>
    </form>
  );
};
