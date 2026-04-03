"use client";

import React from "react";

export const ProviderSilhouette = React.memo(function ProviderSilhouette() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-24 h-24"
    >
      <circle cx="60" cy="38" r="22" stroke="white" strokeWidth="2.5" />
      <path
        d="M18 110 C18 80 42 72 60 72 C78 72 102 80 102 110"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M48 72 L44 90 M72 72 L76 90"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
});
