import { Section } from "@/components/shared/section";
import { Eyebrow, H2 } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { OUTCOMES } from "@/constants/content";

/**
 * 05 · Quantified outcomes. Numbers outperform adjectives — a small band of
 * credible, customer-framed metrics. Replace with real figures as they're
 * gathered; until then these are defensible outcomes, not invented precision.
 */
export function Outcomes() {
  return (
    <Section className="bg-[#fafafa] border-y border-line">
      <Reveal className="max-w-2xl mx-auto text-center">
        <Eyebrow>The results</Eyebrow>
        <H2>Less time on admin. More time fully booked.</H2>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {OUTCOMES.map((outcome, i) => (
          <Reveal
            as="div"
            key={outcome.label}
            delay={0.1 + i * 0.1}
            className="rounded-xl border border-line bg-white p-7 text-center"
          >
            <outcome.icon
              className="mx-auto h-5 w-5 text-brand-purple"
              aria-hidden="true"
            />
            <div className="mt-4 text-4xl font-semibold tracking-tight bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
              {outcome.value}
            </div>
            <p className="mt-2 text-subtle text-sm leading-[1.5]">
              {outcome.label}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
