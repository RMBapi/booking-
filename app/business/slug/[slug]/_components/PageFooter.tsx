import React from "react";
import { Instagram, Facebook } from "lucide-react";
import { Business } from "@/types";
import { ELEGANZA } from "@/lib/publicBrand";

interface PageFooterProps {
  business: Business;
}

export function PageFooter({ business }: PageFooterProps) {
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

        <div className="flex items-center gap-5">
          <a
            href="#"
            className="transition-colors"
            style={{ color: ELEGANZA.inkMuted }}
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="transition-colors"
            style={{ color: ELEGANZA.inkMuted }}
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
