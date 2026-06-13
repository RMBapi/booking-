import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { FINAL_CTA } from "@/constants/content";

/**
 * 12 · Final CTA band. Closes the page with a single, repeated CTA that echoes
 * the hero promise — catching the scroller who read everything and is ready.
 */
export function FinalCta() {
  return (
    <section id="contact" className="relative overflow-hidden bg-[#0b0c10]">
      {/* Brand glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 30% 20%, color-mix(in srgb, var(--color-brand-blue) 34%, transparent), transparent 70%), radial-gradient(50% 60% at 78% 90%, color-mix(in srgb, var(--color-brand-purple) 30%, transparent), transparent 70%)",
        }}
      />
      <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-balance text-white text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight">
            {FINAL_CTA.heading}
          </h2>
          <div className="mt-8">
            <a
              href="#pricing"
              className="group inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-10px_rgba(255,255,255,0.4)]"
            >
              {FINAL_CTA.cta}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
          <p className="mt-5 text-white/70 text-[13px]">
            {FINAL_CTA.reassurance.map((item, i) => (
              <span key={item}>
                {i > 0 && <span className="mx-2 text-white/30">·</span>}
                ✓ {item}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
