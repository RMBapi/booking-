import { ArrowRight } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { ShowcaseImage } from "@/components/sections/showcase-image";
import { JOURNEY_STEPS } from "@/constants/content";

/**
 * 04 · Core feature journey. The product told as a numbered sequence —
 * Create → Set up services → Get booked → Manage — rather than a flat feature
 * wall. Image side alternates each row; each block is named by its outcome.
 */
export function FeatureJourney() {
  return (
    <Section id="features" containerClassName="max-w-7xl">
      <Reveal className="max-w-2xl">
        <Eyebrow>How it works</Eyebrow>
        <H2>From empty page to fully booked, in four steps.</H2>
        <Lead>
          Build your site, model your real operation, let customers book
          themselves, and run it all from one calendar.
        </Lead>
      </Reveal>

      <div id="journey" className="mt-16 space-y-20 lg:space-y-28">
        {JOURNEY_STEPS.map((step, i) => (
          <Reveal key={step.num} delay={0.05}>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Copy */}
              <div className={step.imageSide === "left" ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold tracking-[0.08em] text-brand-purple">
                    STEP {step.num}
                  </span>
                  <span className="h-px flex-1 max-w-[3rem] bg-gradient-to-r from-brand-purple/40 to-transparent" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                    {step.kicker}
                  </span>
                </div>

                <h3 className="mt-4 text-ink text-2xl leading-[1.2] font-semibold tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-subtle text-base leading-[1.6]">
                  {step.desc}
                </p>

                {step.chips && (
                  <ul className="mt-5 flex flex-wrap gap-2 list-none">
                    {step.chips.map((chip) => (
                      <li
                        key={chip}
                        className="rounded-full border border-line bg-[#fafafa] px-3 py-1.5 text-[12px] text-ink"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                )}

                {step.cta && (
                  <a
                    href="#pricing"
                    className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue transition-colors hover:text-brand-purple"
                  >
                    {step.cta}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                )}
              </div>

              {/* Visual */}
              <div className={step.imageSide === "left" ? "lg:order-1" : ""}>
                <ShowcaseImage
                  image={step.image}
                  label={`${step.kicker} — ${step.title}`}
                  sizes="(min-width: 1024px) 560px, 100vw"
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
