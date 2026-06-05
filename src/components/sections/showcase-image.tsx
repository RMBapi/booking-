"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image, { type StaticImageData } from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { backdropFade, modalPanel } from "@/lib/motion";

/**
 * The large, clickable product-showcase screenshot. Renders the image inside
 * the section card with a zoom-in affordance, and opens an accessible lightbox
 * (focus-trapped dialog, Esc / backdrop / button to close, focus restored on
 * close) showing the same image full-size.
 */
export function ShowcaseImage({
  image,
  label,
  sizes = "(min-width: 1024px) 60vw, 100vw",
}: {
  image: StaticImageData;
  label: string;
  /** `sizes` for the in-page trigger image; tune to the layout it sits in. */
  sizes?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        // Trap focus within the dialog.
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      // Restore focus to the trigger (or wherever it was) on close.
      (trigger ?? previouslyFocused)?.focus();
    };
  }, [open, close]);

  return (
    <>
      <div className="relative">
        <span aria-hidden className="showcase-glow" />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Enlarge ${label} preview`}
          className="showcase-frame group block w-full cursor-zoom-in transition-shadow duration-300 hover:shadow-[0_38px_90px_-26px_color-mix(in_srgb,var(--color-brand-blue)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
        >
          <Image
            src={image}
            alt={`${label} preview`}
            sizes={sizes}
            quality={90}
            placeholder="blur"
            className="block h-auto w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        </button>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
                variants={backdropFade}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={close}
              >
                <motion.div
                  ref={panelRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${label} preview`}
                  className="relative"
                  style={{ width: "min(1400px, 92vw)" }}
                  variants={modalPanel}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    aria-label="Close enlarged preview"
                    className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-white/90 text-ink shadow-lg backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
                    <Image
                      src={image}
                      alt={`${label} preview`}
                      sizes="92vw"
                      quality={90}
                      placeholder="blur"
                      className="block h-auto w-full"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
