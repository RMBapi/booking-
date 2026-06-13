import { Star } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { PROOF_STAT, REVIEW_BADGES } from "@/constants/content";

/**
 * 02 · Social-proof strip — proof before the pitch. A headline stat alongside
 * third-party review badges, sitting directly under the hero to lower
 * skepticism early.
 */
export function SocialProof() {
  return (
    <section className="border-y border-line bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-6 py-7">
        <Reveal className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 items-center text-center">
          <div>
            <div className="text-ink text-2xl font-semibold tracking-tight">
              {PROOF_STAT.value}
            </div>
            <p className="mt-1 text-subtle text-[13px]">{PROOF_STAT.label}</p>
          </div>

          {REVIEW_BADGES.map((badge) => (
            <div key={badge.name} className="sm:border-l border-line">
              <div
                className="flex items-center justify-center gap-0.5 text-brand-amber"
                aria-hidden="true"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-1.5 text-subtle text-[13px]">
                <span className="text-ink font-medium">{badge.rating}</span> on{" "}
                {badge.name}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
