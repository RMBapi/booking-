"use client";

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-subtle" />
        <div className="h-9 w-56 max-w-full rounded-lg bg-subtle" />
        <div className="h-4 w-72 max-w-full rounded bg-subtle" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-48 rounded-2xl bg-subtle" />
        <div className="h-48 rounded-2xl bg-subtle" />
      </div>
      <div className="h-64 rounded-2xl bg-subtle" />
    </div>
  );
}
