import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { INTEGRATIONS } from "@/constants/content";

/**
 * 07 · Integrations. Reduces switching anxiety ("will it fit my stack?").
 * Calendar sync + payments are the table-stakes logos; keep to recognizable
 * names and link out to a full integrations page later.
 */
export function Integrations() {
  return (
    <Section id="integrations">
      <Reveal className="max-w-2xl mx-auto text-center">
        <Eyebrow>Integrations</Eyebrow>
        <H2>Works with the tools you already use.</H2>
        <Lead>
          Sync calendars, take payments and run video calls without leaving your
          workflow.
        </Lead>
      </Reveal>

      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 list-none">
        {INTEGRATIONS.map((integration, i) => (
          <Reveal
            as="li"
            key={integration.name}
            delay={0.05 + i * 0.06}
            className="flex items-center justify-center gap-2.5 rounded-lg border border-line bg-white px-4 py-5 text-center transition-colors duration-300 hover:border-brand-blue/30"
          >
            <integration.icon
              className="h-4.5 w-4.5 text-subtle shrink-0"
              aria-hidden="true"
            />
            <span className="text-ink text-sm font-medium">
              {integration.name}
            </span>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
