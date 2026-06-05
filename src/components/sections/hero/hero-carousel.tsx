"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { HeroShot } from "@/types";

/**
 * Mobile-only swipeable carousel of the hero screenshots. Uses native
 * scroll-snap (momentum + swipe for free) with a category badge above each
 * slide and dot indicators below. Tapping a slide opens the lightbox.
 */
export function HeroCarousel({
  shots,
  onOpen,
}: {
  shots: HeroShot[];
  onOpen: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Track the centered slide via IntersectionObserver for the dot indicators.
  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = slideRefs.current.indexOf(e.target as HTMLDivElement);
            if (i >= 0) setActive(i);
          }
        });
      },
      { root, threshold: 0.6 },
    );
    slideRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (i: number) => {
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className="lg:hidden">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shots.map((shot, i) => {
          const customer = shot.category === "customer";
          const accent = customer
            ? "var(--color-brand-blue)"
            : "var(--color-brand-purple)";
          return (
            <div
              key={shot.title + i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="snap-center shrink-0 w-[82vw] max-w-[420px]"
            >
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border text-[10px] font-semibold tracking-[0.1em] shadow-sm"
                style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`, color: accent }}
              >
                ● {shot.categoryLabel}
              </span>
              <button
                type="button"
                onClick={() => onOpen(i)}
                aria-label={`${shot.categoryLabel} — ${shot.title}`}
                className="relative mt-2 block w-full aspect-[16/10] rounded-[20px] overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.4)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                }}
              >
                <Image
                  src={shot.src}
                  alt={shot.title}
                  fill
                  priority={i === 0}
                  quality={90}
                  sizes="82vw"
                  placeholder="blur"
                  className="object-cover"
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {shots.map((s, i) => (
          <button
            key={s.title + i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to screenshot ${i + 1}`}
            aria-current={i === active}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-brand-purple" : "w-2 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
