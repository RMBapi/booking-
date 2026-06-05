"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { EASE, backdropFade, modalPanel } from "@/lib/motion";
import type { HeroShot } from "@/types";

const SWIPE_THRESHOLD = 70;

/**
 * Full-screen image viewer for the hero screenshots. Supports prev/next
 * arrows, keyboard arrows, touch swipe and a thumbnail rail. `index` of null
 * means closed.
 */
export function HeroLightbox({
  shots,
  index,
  onNavigate,
  onClose,
}: {
  shots: HeroShot[];
  index: number | null;
  onNavigate: (next: number) => void;
  onClose: () => void;
}) {
  const open = index !== null;

  const go = useCallback(
    (dir: number) => {
      if (index === null) return;
      onNavigate((index + dir + shots.length) % shots.length);
    },
    [index, shots.length, onNavigate],
  );

  // Keyboard navigation + scroll lock while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go, onClose]);

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_THRESHOLD) go(1);
    else if (info.offset.x >= SWIPE_THRESHOLD) go(-1);
  };

  const shot = index !== null ? shots[index] : null;

  return (
    <AnimatePresence>
      {open && shot && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          variants={backdropFade}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${shot.categoryLabel} — ${shot.title}`}
        >
          <motion.div
            className="relative w-[min(1400px,90vw)] max-h-[92vh] overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
            variants={modalPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/80 border border-line text-ink hover:bg-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col lg:flex-row max-h-[92vh]">
              {/* Main viewer */}
              <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between gap-3 pr-10">
                  <CategoryBadge shot={shot} />
                  <span className="text-xs text-subtle tabular-nums shrink-0">
                    {index! + 1} / {shots.length}
                  </span>
                </div>

                <motion.div
                  className="relative mt-4 w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#f4f4f7] border border-line cursor-grab active:cursor-grabbing"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.16}
                  onDragEnd={onDragEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.01 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE }}
                    >
                      <Image
                        src={shot.src}
                        alt={shot.title}
                        fill
                        quality={90}
                        sizes="(min-width: 1024px) 70vw, 90vw"
                        placeholder="blur"
                        className="object-cover pointer-events-none select-none"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <NavArrow side="left" onClick={() => go(-1)} />
                  <NavArrow side="right" onClick={() => go(1)} />
                </motion.div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{shot.title}</p>
                  <span className="text-sm font-medium bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
                    {shot.actionHint} →
                  </span>
                </div>
              </div>

              {/* Thumbnail rail */}
              <aside className="shrink-0 lg:w-[150px] border-t lg:border-t-0 lg:border-l border-line p-3 lg:p-4">
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
                  {shots.map((s, i) => {
                    const active = i === index;
                    return (
                      <button
                        key={s.title + i}
                        type="button"
                        onClick={() => onNavigate(i)}
                        aria-label={`View ${s.title}`}
                        aria-current={active}
                        className={`relative shrink-0 w-[112px] lg:w-full aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          active
                            ? "border-brand-purple ring-2 ring-brand-purple/25"
                            : "border-line opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={s.src}
                          alt=""
                          fill
                          quality={75}
                          sizes="150px"
                          placeholder="blur"
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CategoryBadge({ shot }: { shot: HeroShot }) {
  const accent =
    shot.category === "customer"
      ? "var(--color-brand-blue)"
      : "var(--color-brand-purple)";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border text-[11px] font-semibold tracking-[0.12em] shadow-sm"
      style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}
    >
      <span style={{ color: accent }}>●</span>
      <span style={{ color: accent }}>{shot.categoryLabel}</span>
    </span>
  );
}

function NavArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous screenshot" : "Next screenshot"}
      className={`absolute top-1/2 -translate-y-1/2 ${
        side === "left" ? "left-3" : "right-3"
      } z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 border border-line text-ink shadow-md hover:bg-white hover:scale-105 transition-all`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
