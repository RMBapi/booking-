"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { FeatureCode } from "@/types";

interface FeatureGateProps {
  feature?: FeatureCode | FeatureCode[];
  mode?: "all" | "any";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({
  feature,
  mode = "all",
  fallback = null,
  children,
}: FeatureGateProps) {
  const { hasAllFeatures, hasAnyFeature } = usePermissions();

  if (!feature) return <>{children}</>;

  const codes = Array.isArray(feature) ? feature : [feature];
  const ok =
    mode === "any" ? hasAnyFeature(codes) : hasAllFeatures(codes);

  return <>{ok ? children : fallback}</>;
}
