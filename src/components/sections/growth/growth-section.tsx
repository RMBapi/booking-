import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { ShowcaseImage } from "@/components/sections/showcase-image";
import { growthShowcase } from "@/assets/images";

export function GrowthSection() {
  return (
    <Section>
      <Reveal className="max-w-2xl">
        <Eyebrow>Growth</Eyebrow>
        <H2>Built to make your business measurably bigger.</H2>
        <Lead>
          Operators see more bookings, fewer no-shows and dramatic time savings within
          their first 30 days.
        </Lead>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <ShowcaseImage
          image={growthShowcase}
          label="Business growth dashboard — revenue, bookings and retention"
          sizes="(max-width: 1024px) 100vw, 1100px"
        />
      </Reveal>
    </Section>
  );
}
