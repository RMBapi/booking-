import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { INDUSTRIES } from "@/constants/content";

/**
 * 06 · Built for your industry. Self-identification tiles so a visitor instantly
 * sees themselves. Salons lead the grid — the sharpest example for our
 * many-services / many-staff target.
 */
export function Industries() {
  return (
    <Section id="industries">
      <Reveal className="max-w-2xl mx-auto text-center">
        <Eyebrow>Built for your industry</Eyebrow>
        <H2>Whatever you do, it fits.</H2>
        <Lead>
          If your business runs on appointments, BookBites is built for the way
          you work.
        </Lead>
      </Reveal>

      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 list-none">
        {INDUSTRIES.map((industry, i) => (
          <Reveal as="li" key={industry.name} delay={0.05 + i * 0.07}>
            <a
              href="#pricing"
              className="group flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-line bg-white p-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-purple/30 hover:shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--color-brand-purple)_50%,transparent)]"
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${industry.bgColor}`}
              >
                <industry.icon
                  className={`h-6 w-6 ${industry.color}`}
                  aria-hidden="true"
                />
              </span>
              <span className="text-ink text-sm font-medium">
                {industry.name}
              </span>
            </a>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
