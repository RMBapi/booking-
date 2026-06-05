import { Sparkles } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { FEATURES } from "@/constants/content";

export function FeaturesOverview() {
  return (
    <section className="bg-gradient-to-b from-[#fafafa] to-white pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-brand-purple" />
            <span className="text-brand-purple text-[13px] font-semibold tracking-[0.05em] uppercase">
              All-in-One Booking Solution
            </span>
          </div>
          <h2 className="text-ink text-xl font-semibold">
            More Bookings. Happier clients. Simpler business.
          </h2>
        </Reveal>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 list-none">
          {FEATURES.map((feature, idx) => (
            <Reveal as="li" key={feature.title} delay={0.1 + idx * 0.1} className="text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.bgColor} mb-3`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} aria-hidden="true" />
              </div>
              <h3 className="text-ink text-sm font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-subtle text-[13px] leading-[1.5]">{feature.desc}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
