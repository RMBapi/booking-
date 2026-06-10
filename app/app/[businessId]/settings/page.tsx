"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Building2, Clock, Cog, Users, Wrench } from "lucide-react";
import { FeatureGate } from "@/components/auth";
import { AccessDenied } from "@/components/auth/AccessDenied";

interface SettingItem {
  href: (id: string) => string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const SETTINGS_GROUPS: SettingItem[] = [
  {
    href: (id) => `/app/${id}/settings/business`,
    title: "Business information",
    description: "Name, contact details, branding and cover image.",
    icon: Building2,
    enabled: true,
  },
  {
    href: (id) => `/app/${id}/settings/opening-hours`,
    title: "Opening hours",
    description: "Set your weekly hours shown to customers on your public page.",
    icon: Clock,
    enabled: true,
  },
  {
    href: (id) => `/app/${id}/team`,
    title: "Team & permissions",
    description: "Invite teammates and assign granular permissions.",
    icon: Users,
    enabled: true,
  },
  {
    href: (id) => `/app/${id}/services`,
    title: "Services & scheduling",
    description: "Manage what you offer and your availability windows.",
    icon: Wrench,
    enabled: true,
  },
];

export default function SettingsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;

  return (
    <FeatureGate feature="view_settings" fallback={<AccessDenied />}>
      <main className="flex flex-col gap-8 max-w-3xl">
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Workspace</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-display mt-1">
            Settings
          </h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            Configure your business preferences and integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SETTINGS_GROUPS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.title}
                href={s.href(businessId)}
                className="group rounded-2xl border border-border-subtle bg-surface p-5 hover:border-primary-200/70 hover:ring-1 hover:ring-primary-100 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-border-subtle text-primary-600 shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{s.title}</p>
                    <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{s.description}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-text-quaternary group-hover:text-primary-500 transition-all duration-200 group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border-subtle bg-subtle/50 p-5 flex items-start gap-3">
          <Cog className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" />
          <p className="text-sm text-text-tertiary leading-relaxed">
            More integrations and developer settings are coming soon.
          </p>
        </div>
      </main>
    </FeatureGate>
  );
}
