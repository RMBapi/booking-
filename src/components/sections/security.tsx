import { ShieldCheck } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { SECURITY_POINTS } from "@/constants/content";

/**
 * 09 · Trust & data security. A CRM stores customer PII and booking history —
 * a short trust block reassures owners they won't be liable. Only claims we can
 * stand behind; no certifications we don't hold.
 */
export function Security() {
  return (
    <Section id="security">
      <Reveal className="grid items-center gap-10 rounded-2xl border border-line bg-gradient-to-br from-white to-[#fafafa] p-8 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <Eyebrow>Trust &amp; security</Eyebrow>
          <H2>Your clients&apos; data is safe with us.</H2>
          <Lead>
            Booking history and customer details are sensitive. We protect them
            with encryption, backups and access controls — so you can focus on
            the business, not the liability.
          </Lead>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 list-none">
          {SECURITY_POINTS.map((point) => (
            <li
              key={point.label}
              className="flex items-start gap-3 rounded-lg border border-line bg-white p-4"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-blue/10">
                <point.icon
                  className="h-4 w-4 text-brand-blue"
                  aria-hidden="true"
                />
              </span>
              <span className="text-ink text-sm leading-[1.45]">
                {point.label}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.1} className="mt-4 flex items-center justify-center gap-2 text-subtle text-[13px]">
        <ShieldCheck className="h-4 w-4 text-brand-blue" aria-hidden="true" />
        Only claims we can stand behind — no badges we haven&apos;t earned.
      </Reveal>
    </Section>
  );
}
