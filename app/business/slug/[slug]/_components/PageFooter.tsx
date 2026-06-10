import React from "react";
import { Instagram, Facebook, type LucideIcon } from "lucide-react";
import { Business, SocialPlatform } from "@/types";
import { ELEGANZA } from "@/lib/publicBrand";

interface PageFooterProps {
  business: Business;
}

/** Maps a backend `platform` value to its icon + accessible label. */
const SOCIAL_META: Record<
  SocialPlatform,
  { Icon: LucideIcon; label: string }
> = {
  facebook: { Icon: Facebook, label: "Facebook" },
  instagram: { Icon: Instagram, label: "Instagram" },
};

export function PageFooter({ business }: PageFooterProps) {
  // Links come from the business record (BE). Keep only entries we can render
  // (known platform + a non-empty url); hide the section entirely when none.
  const socials = (business.socialAccounts ?? []).filter(
    (a) => a?.url && SOCIAL_META[a.platform],
  );

  return (
    <footer
      className="border-t py-10 px-6 lg:px-16"
      style={{
        backgroundColor: ELEGANZA.surface,
        borderColor: ELEGANZA.border,
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <span
            className="font-[var(--font-display)] uppercase tracking-[0.2em]"
            style={{ fontSize: "1.1rem", color: ELEGANZA.ink }}
          >
            {business.name.toUpperCase()}
          </span>
          <p className="text-xs mt-1" style={{ color: ELEGANZA.inkMuted }}>
            &copy; {new Date().getFullYear()} {business.name}. All rights
            reserved.
          </p>
        </div>

        {socials.length > 0 && (
          <div className="flex items-center gap-5">
            {socials.map((account, i) => {
              const { Icon, label } = SOCIAL_META[account.platform];
              return (
                <a
                  key={`${account.platform}-${i}`}
                  href={account.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-opacity hover:opacity-70"
                  style={{ color: ELEGANZA.inkMuted }}
                  aria-label={label}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </footer>
  );
}
