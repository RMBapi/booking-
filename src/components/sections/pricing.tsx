import { ArrowRight, Check } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { PRICING_TIERS } from "@/constants/content";

/**
 * 10 · Pricing teaser. A preview (and a clear free tier) removes a major exit
 * reason. One "most popular" tier is highlighted and reuses the risk-reversal
 * line; full pricing can live on its own page.
 */
export function Pricing() {
  return (
    <Section id="pricing">
      <Reveal className="max-w-2xl mx-auto text-center">
        <Eyebrow>Pricing</Eyebrow>
        <H2>One subscription. No surprises.</H2>
        <Lead>
          Start free and upgrade when you&apos;re ready. Every plan includes your
          booking site, scheduling and reminders.
        </Lead>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3 items-stretch">
        {PRICING_TIERS.map((tier, i) => (
          <Reveal as="div" key={tier.name} delay={0.1 + i * 0.1} className="h-full">
            <div
              className={`relative flex h-full flex-col rounded-xl border p-7 ${
                tier.popular
                  ? "border-brand-purple/40 bg-gradient-to-b from-blue-50/50 to-purple-50/30 shadow-[0_24px_60px_-30px_color-mix(in_srgb,var(--color-brand-purple)_45%,transparent)]"
                  : "border-line bg-white"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-gradient-to-r from-brand-blue to-brand-purple px-3 py-0.5 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              )}

              <h3 className="text-ink text-sm font-semibold uppercase tracking-[0.08em]">
                {tier.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-ink text-4xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                <span className="text-subtle text-[13px]">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-subtle text-sm leading-[1.5]">
                {tier.blurb}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.popular ? "text-brand-purple" : "text-subtle"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-ink">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`group mt-7 inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-5 text-sm font-medium transition-all duration-300 ${
                  tier.popular
                    ? "bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-purple text-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--color-brand-blue)_50%,transparent)]"
                    : "border border-line bg-white text-ink hover:border-brand-purple/40 hover:bg-[#fafafa]"
                }`}
              >
                {tier.cta}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-6 text-center text-subtle text-[13px]">
        ✓ No credit card required &nbsp;·&nbsp; ✓ 14-day free trial on paid plans
      </Reveal>
    </Section>
  );
}
