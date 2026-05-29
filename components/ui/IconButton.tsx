"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed shrink-0",
  {
    variants: {
      size: {
        sm: "h-8 w-8 [&_svg]:h-3.5 [&_svg]:w-3.5",
        md: "h-9 w-9 [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-10 w-10 [&_svg]:h-[18px] [&_svg]:w-[18px]",
      },
      tone: {
        default: "text-text-tertiary hover:text-text-primary hover:bg-subtle",
        danger: "text-text-tertiary hover:text-rose-600 hover:bg-rose-50/60",
        primary: "text-text-tertiary hover:text-primary-600 hover:bg-primary-50/70",
      },
    },
    defaultVariants: {
      size: "sm",
      tone: "default",
    },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
  tooltip?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, tone, tooltip, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        title={tooltip ?? props["aria-label"]}
        className={cn(iconButtonVariants({ size, tone }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
