import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { ShowcaseImage } from "@/components/sections/showcase-image";
import { CALENDAR_IMAGES, CALENDAR_FEATURES } from "@/constants/content";

export function CalendarSection() {
  return (
    <Section id="calendar">
      <Reveal className="max-w-2xl">
        <Eyebrow>Calendar</Eyebrow>
        <H2>A calendar your team will actually love.</H2>
        <Lead>
          Day, week and month views with drag-and-drop, smart filters and one-tap
          booking creation.
        </Lead>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <ShowcaseImage
          image={CALENDAR_IMAGES.showcase}
          label="Calendar — day, week and month views"
          sizes="(max-width: 1024px) 100vw, 1100px"
        />
      </Reveal>

      <ul className="mt-10 border border-line rounded-lg grid sm:grid-cols-2 lg:grid-cols-4 overflow-hidden list-none">
        {CALENDAR_FEATURES.map((f, i) => (
          <li
            key={f.title}
            className={`p-5 bg-white transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/20 ${
              i !== 0 ? "border-t sm:border-t-0 sm:border-l border-line" : ""
            } ${i >= 2 ? "lg:border-l border-line" : ""}`}
          >
            <f.icon className={`w-4 h-4 ${f.color}`} aria-hidden="true" />
            <p className="mt-3 text-ink text-sm font-medium">{f.title}</p>
            <p className="mt-1 text-subtle text-sm">{f.desc}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
