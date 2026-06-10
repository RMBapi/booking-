import { ArrowRight, Check } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { VALUE_CARDS } from "@/constants/content";

/**
 * 03 · Problem → all-in-one value prop. The product wedge: stop paying for a
 * site builder + a scheduler + a CRM separately. A simple before → after →
 * result comparison dramatizes the consolidation in one screen.
 */
export function ValueProp() {
  return (
    <Section id="all-in-one">
      <Reveal className="max-w-2xl mx-auto text-center">
        <Eyebrow>All-in-one</Eyebrow>
        <H2>Stop stitching tools together.</H2>
        <Lead>
          A website builder, a booking engine and a CRM — most businesses rent
          three. BookBites does all three deeply, on one subscription.
        </Lead>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3 items-stretch">
        {VALUE_CARDS.map((card, i) => (
          <Reveal as="div" key={card.kind} delay={0.1 + i * 0.1} className="h-full">
            <div
              className={`relative h-full flex flex-col rounded-xl border p-6 transition-shadow duration-300 ${
                card.highlight
                  ? "border-brand-purple/40 bg-gradient-to-b from-blue-50/50 to-purple-50/30 shadow-[0_24px_60px_-30px_color-mix(in_srgb,var(--color-brand-purple)_45%,transparent)]"
                  : "border-line bg-white"
              }`}
            >
              {card.highlight && (
                <span className="absolute -top-2.5 left-6 inline-flex items-center rounded-full bg-gradient-to-r from-brand-blue to-brand-purple px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  BookBites
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                    card.highlight ? "bg-white" : "bg-[#f5f5f5]"
                  }`}
                >
                  <card.icon
                    className={`h-4.5 w-4.5 ${
                      card.highlight ? "text-brand-purple" : "text-subtle"
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                  {card.kind}
                </span>
              </div>

              <h3 className="mt-4 text-ink text-lg font-semibold tracking-[-0.01em]">
                {card.title}
              </h3>

              <ul className="mt-4 space-y-2.5 text-sm">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        card.highlight ? "text-brand-purple" : "text-subtle"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-ink">{point}</span>
                  </li>
                ))}
              </ul>

              {i < VALUE_CARDS.length - 1 && (
                <ArrowRight
                  className="hidden md:block absolute top-1/2 -right-[1.85rem] -translate-y-1/2 h-5 w-5 text-line"
                  aria-hidden="true"
                />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
