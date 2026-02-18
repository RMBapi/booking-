"use client";

import React, { useEffect } from "react";
import { useGetMyBusinesses } from "../hooks";
import { Business } from "@/types";

interface BusinessSwitcherProps {
  currentBusinessId: string | null;
  onChange: (businessId: string) => void;
}

export const BusinessSwitcher: React.FC<BusinessSwitcherProps> = ({
  currentBusinessId,
  onChange,
}) => {
  const { businesses, isLoading } = useGetMyBusinesses();

  // Initialize selection from localStorage or first business
  useEffect(() => {
    if (!isLoading && businesses.length > 0 && !currentBusinessId) {
      const savedId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("currentBusinessId")
          : null;
      const initialId =
        savedId && businesses.find((b) => b.id === savedId)
          ? savedId
          : businesses[0].id;
      onChange(initialId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("currentBusinessId", initialId);
      }
    }
  }, [businesses, isLoading, currentBusinessId, onChange]);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Loading businesses for switcher...
      </div>
    );
  }

  if (businesses.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">
        Select Business:
      </label>
      <select
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        value={currentBusinessId || ""}
        onChange={(e) => {
          const id = e.target.value;
          onChange(id);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("currentBusinessId", id);
          }
        }}
      >
        {businesses.map((business: Business) => (
          <option key={business.id} value={business.id}>
            {business.name}
          </option>
        ))}
      </select>
    </div>
  );
};

