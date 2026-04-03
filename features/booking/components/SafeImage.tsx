"use client";

import React, { useState } from "react";

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
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
});
