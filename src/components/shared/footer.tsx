import { Logo } from "@/components/shared/logo";
import { FOOTER, FOOTER_COLUMNS } from "@/constants/site";

/**
 * 13 · Footer. Sitemap-style: brand + tagline alongside product, solutions and
 * company link columns, with copyright underneath.
 */
export function Footer() {
  return (
    <footer className="border-t border-line bg-[#0b0c10] text-white/70">
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo className="h-8 w-auto brightness-0 invert" />
          <p className="mt-4 max-w-xs text-white/60 text-sm leading-[1.6]">
            {FOOTER.tagline}
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-white text-[11px] font-semibold uppercase tracking-[0.12em]">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2.5 list-none">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/60 text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/50 text-sm">
        <p>{FOOTER.copyright}</p>
        <p>{FOOTER.note}</p>
      </div>
    </footer>
  );
}
