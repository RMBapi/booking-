"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  onClear?: () => void;
  size?: "sm" | "md";
  hint?: string;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      onClear,
      placeholder = "Search…",
      value,
      size = "md",
      hint,
      ...props
    },
    ref,
  ) => {
    const hasValue = typeof value === "string" && value.length > 0;
    const heightClass = size === "sm" ? "h-9" : "h-10";

    return (
      <div className={cn("relative w-full", containerClassName)}>
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none",
            size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
          )}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-9 rounded-lg bg-subtle/70 border border-transparent text-sm text-text-primary placeholder:text-text-tertiary",
            "transition-[border,background,box-shadow] duration-150",
            "focus:outline-none focus:bg-surface focus:border-primary-200 focus:ring-2 focus:ring-primary-100",
            heightClass,
            className,
          )}
          {...props}
        />
        {hasValue && onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-6 w-6 rounded-md text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : hint ? (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-5 px-1.5 rounded border border-border-subtle bg-surface text-[10px] font-mono text-text-tertiary tabular">
            {hint}
          </kbd>
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
