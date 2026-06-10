import { Star } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2 } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { TESTIMONIALS } from "@/constants/content";

/**
 * 08 · Testimonials. Quote + name + role, with a result inside the quote where
 * possible. Roles are matched to the industry tiles so each visitor sees
 * someone like them.
 */
export function Testimonials() {
  return (
    <Section className="bg-[#fafafa] border-y border-line">
      <Reveal className="max-w-2xl mx-auto text-center">
        <Eyebrow>Loved by operators</Eyebrow>
        <H2>Real businesses, fewer headaches.</H2>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3 items-stretch">
        {TESTIMONIALS.map((t, i) => (
          <Reveal
            as="figure"
            key={t.name}
            delay={0.1 + i * 0.1}
            className="flex h-full flex-col rounded-xl border border-line bg-white p-6"
          >
            <div
              className="flex items-center gap-0.5 text-brand-amber"
              aria-hidden="true"
            >
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>

            <blockquote className="mt-4 flex-1 text-ink text-[15px] leading-[1.6]">
              “{t.quote}”
            </blockquote>

            <figcaption className="mt-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-xs font-semibold text-white">
                {t.initials}
              </span>
              <span>
                <span className="block text-ink text-sm font-medium">
                  {t.name}
                </span>
                <span className="block text-subtle text-[13px]">{t.role}</span>
              </span>
            </figcaption>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
