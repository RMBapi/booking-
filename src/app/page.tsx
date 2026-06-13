import { SiteLayout } from "@/layouts/site-layout";
import { Hero } from "@/components/sections/hero/hero";
import { SocialProof } from "@/components/sections/social-proof";
import { ValueProp } from "@/components/sections/value-prop";
import { FeatureJourney } from "@/components/sections/feature-journey";
import { Outcomes } from "@/components/sections/outcomes";
import { Industries } from "@/components/sections/industries";
import { Integrations } from "@/components/sections/integrations";
import { Testimonials } from "@/components/sections/testimonials";
import { Security } from "@/components/sections/security";
import { Pricing } from "@/components/sections/pricing";
import { FAQ } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

/**
 * Landing page — section order follows the strategic wireframe blueprint:
 * 01 Hero · 02 Social proof · 03 All-in-one value · 04 Feature journey ·
 * 05 Outcomes · 06 Industries · 07 Integrations · 08 Testimonials ·
 * 09 Security · 10 Pricing · 11 FAQ · 12 Final CTA.
 */
export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <SocialProof />
      <ValueProp />
      <FeatureJourney />
      <Outcomes />
      <Industries />
      <Integrations />
      <Testimonials />
      <Security />
      <Pricing />
      <FAQ />
      <FinalCta />
    </SiteLayout>
  );
}
