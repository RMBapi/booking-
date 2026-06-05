import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2 } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT } from "@/constants/site";

const FIELD = "border border-line shadow-none rounded-md h-9 text-sm";

export function Contact() {
  return (
    <Section id="contact">
      <Reveal className="grid lg:grid-cols-2 border border-line rounded-lg overflow-hidden bg-white">
        <div className="p-10">
          <Eyebrow>Contact</Eyebrow>
          <H2>Talk to us. We&apos;ll get you live this week.</H2>
          <p className="mt-3 text-subtle text-base leading-[1.6]">Real humans, fast replies.</p>
          <address className="mt-8 space-y-3 text-sm not-italic">
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-3 text-ink transition-colors hover:text-brand-blue"
            >
              <Mail className="w-4 h-4 text-brand-blue" aria-hidden="true" /> {CONTACT.email}
            </a>
            <a
              href={`tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`}
              className="flex items-center gap-3 text-ink transition-colors hover:text-brand-purple"
            >
              <Phone className="w-4 h-4 text-brand-purple" aria-hidden="true" /> {CONTACT.phone}
            </a>
            <p className="flex items-center gap-3 text-ink">
              <MapPin className="w-4 h-4 text-brand-cyan" aria-hidden="true" /> {CONTACT.locations}
            </p>
          </address>
        </div>

        <div className="p-10 border-t lg:border-t-0 lg:border-l border-line">
          <h3 className="text-ink text-base font-medium">Book a demo</h3>
          <p className="mt-1 text-subtle text-sm">A 20-minute walk through your use case.</p>
          <form className="mt-5 grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First name
              </label>
              <Input id="firstName" name="firstName" autoComplete="given-name" placeholder="First name" className={FIELD} />
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last name
              </label>
              <Input id="lastName" name="lastName" autoComplete="family-name" placeholder="Last name" className={FIELD} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="sr-only">
                Work email
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="Work email" className={FIELD} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="business" className="sr-only">
                Business name
              </label>
              <Input id="business" name="business" autoComplete="organization" placeholder="Business name" className={FIELD} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className="sr-only">
                Tell us about your business
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us about your business…"
                className="border border-line shadow-none rounded-md text-sm"
                rows={3}
              />
            </div>
            <Button
              type="button"
              className="sm:col-span-2 mt-0 w-full h-9 rounded-md bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-purple text-white shadow-none transition-all duration-300 hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--color-brand-purple)_50%,transparent)] hover:-translate-y-0.5 text-sm font-medium"
            >
              Request demo <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </Reveal>
    </Section>
  );
}
