import React from "react";
import { Instagram, Facebook } from "lucide-react";
import { Business } from "@/types";
import { BRAND } from "@/lib/publicBrand";

interface PageFooterProps {
  business: Business;
}

export function PageFooter({ business }: PageFooterProps) {
  return (
    <footer
      className="border-t py-10 px-6 lg:px-16"
      style={{ backgroundColor: BRAND.darker, borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <span
            className="font-black uppercase tracking-widest text-white"
            style={{ fontSize: "1.1rem", letterSpacing: "0.1em" }}
          >
            {business.name.toUpperCase()}
          </span>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="#"
            className="text-white/40 transition-colors hover:text-brand-accent"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="text-white/40 transition-colors hover:text-brand-accent"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>

        <div
          className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
