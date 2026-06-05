import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { ShowcaseImage } from "@/components/sections/showcase-image";
import * as img from "@/assets/images";

const PILLARS = [
  {
    title: "Self-service site",
    body: "Clients browse your services, pick a time, and confirm in seconds — no phone tag, no waiting on a reply.",
  },
  {
    title: "Built-in CRM",
    body: "Calls and walk-ins? Create the booking yourself in a couple of clicks, straight from your dashboard.",
  },
];

export function OnePlatform() {
  return (
    <Section id="one-platform" containerClassName="max-w-7xl">
      <Reveal className="max-w-2xl">
        <Eyebrow>One platform</Eyebrow>
        <H2>Customers book themselves. Or you book them in.</H2>
        <Lead>
          A self-service site for your clients and a built-in CRM for your team —
          one platform that handles every booking, your way.
        </Lead>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <ShowcaseImage
          image={img.onePlatform}
          label="One platform, two ways to book"
          sizes="(min-width: 1280px) 1232px, 100vw"
        />
      </Reveal>

      <div className="mt-14 grid gap-10 md:grid-cols-2 lg:gap-14">
        {PILLARS.map((p, i) => (
          <Reveal
            key={p.title}
            delay={i * 0.1}
            className="border-t border-line pt-6"
          >
            <h3 className="text-ink text-lg font-semibold tracking-[-0.01em]">
              {p.title}
            </h3>
            <p className="mt-2 text-subtle text-base leading-[1.6]">{p.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-12">
        <p className="mx-auto max-w-3xl text-center text-ink text-base sm:text-lg leading-[1.6]">
          Create a service once and it&apos;s live everywhere — on your booking site
          and in your CRM. However a booking comes in, it lands in the{" "}
          <span className="font-medium bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
            same calendar
          </span>
          .
        </p>
      </Reveal>
    </Section>
  );
}
