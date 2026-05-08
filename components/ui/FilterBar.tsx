"use client";

import React from "react";
import { cn } from "@/utils";

export interface FilterBarProps {
  search?: React.ReactNode;
  chips?: React.ReactNode;
  trailing?: React.ReactNode;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({
  search,
  chips,
  trailing,
  onClearAll,
  hasActiveFilters,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3",
        className,
      )}
    >
      {search && <div className="flex-1 min-w-0 sm:max-w-sm">{search}</div>}
      {chips && (
        <div className="flex items-center gap-2 flex-wrap">
          {chips}
          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      {trailing && <div className="sm:ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}
