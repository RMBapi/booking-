import { Section } from "@/components/shared/section";
import { Eyebrow, H2 } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/constants/content";

export function FAQ() {
  return (
    <Section id="faq">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <H2>Questions, answered.</H2>
        </Reveal>
        <Reveal delay={0.15}>
          <Accordion
            type="single"
            collapsible
            className="mt-10 border border-line rounded-lg bg-white"
          >
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem
                key={item.q}
                value={`faq-${idx}`}
                className={`${idx !== 0 ? "border-t border-line" : ""} border-b-0 px-5`}
              >
                <AccordionTrigger className="text-left text-ink hover:no-underline py-4 text-sm font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-subtle text-sm leading-[1.6]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
