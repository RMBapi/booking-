import { Logo } from "@/components/shared/logo";
import { FOOTER } from "@/constants/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Logo />
        <p className="mt-4 max-w-xs text-subtle text-sm leading-[1.6]">
          {FOOTER.tagline}
        </p>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-subtle text-sm">
        <p>{FOOTER.copyright}</p>
        <p>{FOOTER.note}</p>
      </div>
    </footer>
  );
}
