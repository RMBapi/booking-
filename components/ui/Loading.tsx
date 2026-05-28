"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/utils";
import { ELEGANZA } from "@/lib/publicBrand";
import { ELEGANZA_TEXT_REVEAL_LOADER } from "@/lib/assets";

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

function LoaderGif({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn("flex flex-col items-center gap-4", className)}
        aria-label="Loading"
      >
        <div
          className="h-1 w-24 rounded-full overflow-hidden"
          style={{ backgroundColor: ELEGANZA.border }}
        >
          <div
            className="h-full w-1/2 rounded-full animate-pulse"
            style={{ backgroundColor: ELEGANZA.accent }}
          />
        </div>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={ELEGANZA_TEXT_REVEAL_LOADER}
      alt=""
      aria-hidden="true"
      className={cn("max-w-[min(320px,75vw)] w-full h-auto", className)}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export const PageLoader: React.FC = () => {
  useEffect(() => {
    const img = new window.Image();
    img.src = ELEGANZA_TEXT_REVEAL_LOADER;
  }, []);

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: ELEGANZA.background }}
    >
      <LoaderGif />
    </div>
  );
};
