"use client";

import React, { useState } from "react";
import { isVideoUrl } from "@/utils";

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export const SafeImage = React.memo(function SafeImage({
  src,
  alt,
  className,
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) return null;

  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
});
