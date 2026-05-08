"use client";

import { Users } from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";

export default function ContactsPage() {
  return (
    <FeatureGate feature="view_contacts" fallback={<AccessDenied />}>
      <main className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Customers</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
            Contacts
          </h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            Everyone who has ever booked with you.
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface p-12 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-border-subtle flex items-center justify-center">
            <Users className="h-5 w-5 text-text-tertiary" />
          </div>
          <p className="text-sm font-medium text-text-secondary mt-4">No contacts yet</p>
          <p className="text-xs text-text-tertiary mt-1">When customers book, they&apos;ll appear here.</p>
        </div>
      </main>
    </FeatureGate>
  );
}
