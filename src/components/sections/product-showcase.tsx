"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Eyebrow, H2, Lead } from "@/components/shared/typography";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShowcaseImage } from "@/components/sections/showcase-image";
import { tabPanel } from "@/lib/motion";
import { SHOWCASE_TABS } from "@/constants/content";

export function ProductShowcase() {
  // Controlled so the active panel can crossfade via AnimatePresence. Radix
  // still owns the triggers (roles, roving focus, arrow-key activation).
  const [active, setActive] = useState(SHOWCASE_TABS[0].key);
  const tab = SHOWCASE_TABS.find((t) => t.key === active) ?? SHOWCASE_TABS[0];

  return (
    <Section id="features" containerClassName="max-w-7xl">
      <Reveal className="max-w-2xl">
        <Eyebrow>Product</Eyebrow>
        <H2>Everything you need. Nothing you don&apos;t.</H2>
        <Lead>
          From your first booking to your thousandth, BookBites gives you focused tools
          to delight customers and grow revenue.
        </Lead>
      </Reveal>

      <Reveal delay={0.1}>
        <Tabs value={active} onValueChange={setActive} className="mt-12">
          <TabsList className="bg-white p-0 h-auto flex flex-wrap gap-0 border border-line rounded-md overflow-hidden">
            {SHOWCASE_TABS.map((t, i) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={`rounded-none px-4 py-2.5 min-h-[44px] transition-all duration-300 text-sm font-medium ${
                  i !== 0 ? "border-l border-line" : ""
                } data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50/60 data-[state=active]:to-purple-50/40 data-[state=active]:text-brand-blue data-[state=active]:shadow-none shadow-none`}
              >
                <t.icon className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Single crossfading panel — text + image transition together. */}
          <div className="mt-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                role="tabpanel"
                aria-label={tab.label}
                variants={tabPanel}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <div className="grid lg:grid-cols-[1fr_1.9fr] gap-10 lg:gap-12 items-center">
                  <div>
                    <h3 className="text-ink text-2xl leading-[1.2] font-semibold tracking-[-0.01em]">
                      {tab.title}
                    </h3>
                    <p className="mt-3 text-subtle text-base leading-[1.6]">{tab.desc}</p>
                    <ul className="mt-6 space-y-3">
                      {tab.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm">
                          <Check className="w-4 h-4 mt-0.5 text-ink shrink-0" aria-hidden="true" />
                          <span className="text-ink">{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="ghost"
                      className="mt-7 h-9 px-0 hover:bg-transparent text-sm font-medium"
                    >
                      Explore {tab.label}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
                    </Button>
                  </div>
                  <ShowcaseImage image={tab.image} label={tab.label} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </Reveal>
    </Section>
  );
}
