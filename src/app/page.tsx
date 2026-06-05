import { SiteLayout } from "@/layouts/site-layout";
import { Hero } from "@/components/sections/hero/hero";
import { FeaturesOverview } from "@/components/sections/features-overview";
import { ProductShowcase } from "@/components/sections/product-showcase";
import { OnePlatform } from "@/components/sections/one-platform";
import { CalendarSection } from "@/components/sections/calendar-section";
import { GrowthSection } from "@/components/sections/growth/growth-section";
import { FAQ } from "@/components/sections/faq";
import { Contact } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <FeaturesOverview />
      <ProductShowcase />
      <OnePlatform />
      <CalendarSection />
      <GrowthSection />
      <FAQ />
      <Contact />
    </SiteLayout>
  );
}
