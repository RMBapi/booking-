import React from "react";
import { cn } from "@/utils";

export const LoadingSpinner: React.FC<{
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-3",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={cn(
          "animate-spin rounded-full border-primary-600 border-t-transparent",
          sizeClasses[size],
          className,
        )}
      />
    </div>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-3 border-primary-600 border-t-transparent mx-auto" />
          <div className="absolute inset-0 rounded-full h-16 w-16 border-3 border-primary-200 mx-auto" />
        </div>
        <p className="mt-6 text-sm font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
};
