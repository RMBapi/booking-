"use client";

import React from "react";
import { normalizeErrorMessage } from "@/lib/errorUtils";
import { ErrorFallback } from "./ErrorFallback";

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  compact?: boolean;
}

interface SectionErrorBoundaryState {
  error: Error | null;
}

export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[SectionErrorBoundary${this.props.sectionName ? `: ${this.props.sectionName}` : ""}]`,
        normalizeErrorMessage(error),
        error,
      );
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          title={
            this.props.sectionName
              ? `Couldn't load ${this.props.sectionName}`
              : undefined
          }
          message="Please try again. Other parts of the page remain available."
          onRetry={this.handleRetry}
          compact={this.props.compact}
        />
      );
    }

    return this.props.children;
  }
}
