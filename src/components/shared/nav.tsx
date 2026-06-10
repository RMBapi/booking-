"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NAV_LINKS, NAV_ACTIONS } from "@/constants/site";

export function Nav() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-line">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        <a
          href="#home"
          className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
          aria-label="BookBites home"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-subtle text-sm"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="relative hover:text-brand-blue transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gradient-to-r after:from-brand-blue after:to-brand-purple hover:after:w-full after:transition-all after:duration-300"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Account actions — Log in + one high-contrast CTA (desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href={NAV_ACTIONS.login.href}
            className="text-subtle text-sm hover:text-brand-blue transition-colors"
          >
            {NAV_ACTIONS.login.label}
          </a>
          <a
            href={NAV_ACTIONS.cta.href}
            className="group inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-purple text-white text-sm font-medium transition-all duration-300 hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--color-brand-blue)_50%,transparent)] hover:-translate-y-0.5"
          >
            {NAV_ACTIONS.cta.label}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>

        {/* Mobile menu toggle (≥44px tap target) */}
        <button
          type="button"
          className="md:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-[#f5f5f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu — slides open; inert (non-focusable) while closed. */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        inert={!open}
        className={`md:hidden overflow-hidden border-t bg-white transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-80 border-line opacity-100" : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <ul className="px-6 py-1.5">
          {NAV_LINKS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-base text-ink hover:text-brand-blue transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="flex items-center gap-3 py-3">
            <a
              href={NAV_ACTIONS.login.href}
              onClick={() => setOpen(false)}
              className="flex-1 text-center py-2.5 rounded-md border border-line text-ink text-sm font-medium"
            >
              {NAV_ACTIONS.login.label}
            </a>
            <a
              href={NAV_ACTIONS.cta.href}
              onClick={() => setOpen(false)}
              className="flex-1 text-center py-2.5 rounded-md bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-purple text-white text-sm font-medium"
            >
              {NAV_ACTIONS.cta.label}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
