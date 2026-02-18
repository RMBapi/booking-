import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

const cardVariants = cva(
  "rounded-2xl border border-border bg-white text-gray-900 shadow-sm transition-all w-full",
  {
    variants: {
      hover: {
        true: "hover:shadow-md hover:border-gray-300",
        false: "",
      },
    },
    defaultVariants: {
      hover: false,
    },
  }
);

const cardPaddingVariants = cva("", {
  variants: {
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    padding: "md",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants>,
    VariantProps<typeof cardPaddingVariants> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      title,
      subtitle,
      headerAction,
      padding = "md",
      hover = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ hover }),
          cardPaddingVariants({ padding }),
          className
        )}
        {...props}
      >
        {(title || subtitle || headerAction) && (
          <div
            className={cn(
              "flex items-start justify-between gap-6 w-full",
              padding !== "none" && "mb-6"
            )}
          >
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-xl font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1.5">{subtitle}</p>
              )}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
