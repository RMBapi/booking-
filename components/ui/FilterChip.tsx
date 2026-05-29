"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils";

export interface FilterChipProps {
  label: string;
  value: string;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({ label, value, onClick, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-8 rounded-full bg-subtle border border-border-subtle text-sm overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 px-3 h-full hover:bg-subtle/70 transition-colors"
      >
        <span className="text-text-tertiary">{label}:</span>
        <span className="text-text-primary font-medium">{value}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="inline-flex items-center justify-center h-full px-2 text-text-tertiary hover:text-text-primary border-l border-border-subtle hover:bg-subtle/70 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}
