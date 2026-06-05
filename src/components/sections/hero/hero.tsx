"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { HeroShotCard } from "@/components/sections/hero/hero-shot";
import { HeroCarousel } from "@/components/sections/hero/hero-carousel";
import { HeroLightbox } from "@/components/sections/hero/hero-lightbox";
import { HERO_SHOTS } from "@/constants/content";
import type { HeroShot } from "@/types";

const HERO_BG =
  "radial-gradient(circle at 12% 38%, color-mix(in srgb, var(--color-brand-blue) 10%, transparent), transparent 46%), radial-gradient(circle at 88% 55%, color-mix(in srgb, var(--color-brand-purple) 9%, transparent), transparent 46%), #ffffff";

// Grid placement + connection-line anchor on each card's inner edge.
// anchorX picks the inner vertical edge (right edge for left cards, left edge
// for right cards). anchorY targets the inner edge on the card's *outer*-vertical
// side (near the top for the top row, near the bottom for the bottom row): the
// big center logo (256px) overlaps the row gap, so the literal logo-facing corner
// sits on the orbit ring and would collapse the curve — this keeps every line
// clearly spanning the gap while still terminating on the card's inner edge.
const CORNER: Record<
  HeroShot["corner"],
  { cell: string; anchorX: number; anchorY: number; delay: number }
> = {
  tl: { cell: "row-start-1 col-start-1", anchorX: 1, anchorY: 0.2, delay: 0 },
  tr: { cell: "row-start-1 col-start-2", anchorX: 0, anchorY: 0.2, delay: 0.1 },
  bl: { cell: "row-start-2 col-start-1", anchorX: 1, anchorY: 0.8, delay: 0.2 },
  br: { cell: "row-start-2 col-start-2", anchorX: 0, anchorY: 0.8, delay: 0.3 },
};

// Soft brand purple shared by the connector lines and nodes (brand token).
const CONNECTOR_PURPLE = "var(--color-brand-iris)";

type Pt = { x: number; y: number };
/** One screenshot's connection: a gentle curve from the orbit ring out to the
 * card, plus the node positions (ring start, ⅓ dot, midpoint label, card edge). */
type Conn = { d: string; start: Pt; third: Pt; mid: Pt; end: Pt };

export function Hero() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Which screenshot is being hovered/focused — drives the line hierarchy.
  const [hovered, setHovered] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [conns, setConns] = useState<Conn[]>([]);
  const [ring, setRing] = useState({ cx: 700, cy: 450, r: 150 });
  const [box, setBox] = useState({ w: 1400, h: 900 });

  // Recompute the orbit ring + connection curves whenever the layout changes.
  useEffect(() => {
    let raf = 0;
    let retries = 0;

    const compute = () => {
      const container = containerRef.current;
      const center = centerRef.current;
      if (!container || !center) return;
      const cRect = container.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const cx = centerRect.left - cRect.left + centerRect.width / 2;
      const cy = centerRect.top - cRect.top + centerRect.height / 2;
      // The orbit sits just outside the logo circle; lines spring from its rim.
      const orbitR = centerRect.width / 2 + 22;
      setBox({ w: cRect.width, h: cRect.height });
      setRing({ cx, cy, r: orbitR });

      const next: Conn[] = [];
      // Distance from the logo centre to each card endpoint — used to detect a
      // not-yet-settled layout (endpoint collapsed onto the ring) below.
      const endpointDistances: number[] = [];
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const { anchorX, anchorY } = CORNER[HERO_SHOTS[i].corner];
        // Card edge nearest the center (the curve's terminus).
        const ex = r.left - cRect.left + r.width * anchorX;
        const ey = r.top - cRect.top + r.height * anchorY;
        // Radial unit vector center → card; the line leaves the ring along it.
        const dx = ex - cx;
        const dy = ey - cy;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const ux = dx / dist;
        const uy = dy / dist;
        const sx = cx + ux * orbitR;
        const sy = cy + uy * orbitR;
        // Gentle, mirror-symmetric bow: top rows arc up, bottom rows arc down.
        // A vertical-only offset stays symmetric under the layout's left/right
        // mirror, so TL↔TR and BL↔BR read as reflections.
        const top = HERO_SHOTS[i].corner === "tl" || HERO_SHOTS[i].corner === "tr";
        const segLen = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
        const bow = segLen * 0.16 * (top ? -1 : 1);
        const cpx = (sx + ex) / 2;
        const cpy = (sy + ey) / 2 + bow;
        // Pull the endpoint node a touch off the card so it stays visible.
        const end = { x: ex - ux * 6, y: ey - uy * 6 };
        // Points on the quadratic Bézier B(t)=(1-t)²·P0 + 2(1-t)t·P1 + t²·P2.
        // t=⅓ → weights (4/9, 4/9, 1/9); t=½ → (¼, ½, ¼).
        next.push({
          d: `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`,
          start: { x: sx, y: sy },
          third: {
            x: (4 / 9) * sx + (4 / 9) * cpx + (1 / 9) * ex,
            y: (4 / 9) * sy + (4 / 9) * cpy + (1 / 9) * ey,
          },
          mid: { x: 0.25 * sx + 0.5 * cpx + 0.25 * ex, y: 0.25 * sy + 0.5 * cpy + 0.25 * ey },
          end,
        });
        endpointDistances.push(dist);
      });

      // A card endpoint must sit well outside the ring; if any is collapsed near
      // the logo the layout isn't settled yet (measured mid-entrance / pre-load),
      // so retry on the next frame instead of committing a bad, near-zero curve.
      const settled =
        next.length === 4 && endpointDistances.every((d) => d > orbitR + 60);

      if (settled || retries >= 30) {
        setConns(next);
      } else {
        retries += 1;
        raf = requestAnimationFrame(compute);
      }
    };

    compute();
    // Re-measure once the entrance animation / web fonts have settled, so the
    // final committed geometry matches the cards' resting positions.
    const settleTimer = window.setTimeout(compute, 1200);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(compute).catch(() => {});
    }

    // Observe the container *and* each card, so any late reflow re-anchors lines.
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (centerRef.current) ro.observe(centerRef.current);
    cardRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <section id="home" className="relative overflow-hidden" style={{ background: HERO_BG }}>
      {/* Headline */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-2 relative text-center">
        <h1 className="text-center text-balance tracking-tight mx-auto text-3xl sm:text-[2.75rem] md:text-5xl lg:text-[3.5rem] leading-[1.15] sm:leading-[1.05] font-semibold animate-[fadeUp_0.7s_ease-out]">
          Run your entire booking{" "}
          <span className="relative inline-block align-baseline">
            {/* glass sheen: a soft, blurred gradient copy behind the crisp text */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-brand-blue via-brand-violet to-brand-purple bg-clip-text text-transparent blur-[10px] opacity-50"
            >
              business
            </span>
            <span className="relative bg-gradient-to-r from-brand-blue/95 via-brand-violet/80 to-brand-purple/95 bg-clip-text text-transparent">
              business
            </span>
          </span>{" "}
          from{" "}
          <span className="bg-gradient-to-r from-brand-blue via-brand-violet to-brand-purple bg-clip-text text-transparent">
            one calm, focused
          </span>{" "}
          platform.
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-subtle text-base leading-[1.6] animate-[fadeUp_0.8s_ease-out]">
          See the customer booking experience and the business CRM side by side —
          two halves of one connected platform.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-[fadeUp_0.9s_ease-out]">
          <Button className="h-10 px-5 rounded-md bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-purple text-white shadow-none transition-all duration-300 hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--color-brand-blue)_50%,transparent)] hover:-translate-y-0.5 group text-sm font-medium">
            Book a demo
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            variant="outline"
            className="h-10 px-5 rounded-md border border-line bg-white shadow-none hover:bg-[#fafafa] hover:border-brand-purple/40 transition-colors text-sm font-medium"
          >
            Watch tour
          </Button>
        </div>
      </div>

      {/* Desktop (lg+) — 2×2 ecosystem grid with connectors around the center
          node. Below lg the connector layer is hidden, so we fall back to the
          swipeable single-column carousel instead of a connector-less grid. */}
      <div className="hidden lg:block px-6 lg:px-8 pb-14">
        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-[1400px] grid grid-cols-2 pt-14"
          style={{
            columnGap: "clamp(12rem, 20vw, 19rem)",
            // Wider row gap pushes the rows further from the centre ring at rest,
            // so the top cards sit clear of the circle even before any hover.
            rowGap: "clamp(7.5rem, 11vw, 11.5rem)",
          }}
        >
          {/* Persistent column category headers */}
          <div className="absolute top-0 left-0 z-30">
            <ColumnHeader category="customer">CUSTOMER EXPERIENCE</ColumnHeader>
          </div>
          <div className="absolute top-0 right-0 z-30">
            <ColumnHeader category="business">BUSINESS MANAGEMENT (CRM)</ColumnHeader>
          </div>

          {/* Connection layer — orbit ring, dashed curves, minimal nodes and an
              editable midpoint label per line. Hidden below 1024px (lg). */}
          <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${box.w} ${box.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Thin, light orbit ring around the logo */}
              <circle
                cx={ring.cx}
                cy={ring.cy}
                r={ring.r}
                fill="none"
                strokeOpacity={0.15}
                strokeWidth={1}
                style={{ stroke: CONNECTOR_PURPLE }}
              />

              {/* Dashed connection curves */}
              {conns.map((c, i) => {
                const op = hovered === null ? 0.5 : hovered === i ? 1 : 0.15;
                return (
                  <path
                    key={i}
                    d={c.d}
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray="5 6"
                    style={{ stroke: CONNECTOR_PURPLE, opacity: op, transition: "opacity 0.3s ease" }}
                  />
                );
              })}
            </svg>

            {/* Minimal nodes: a solid dot at ⅓ and a connector node at the card edge */}
            {conns.map((c, i) => {
              const op = hovered === null ? 0.5 : hovered === i ? 1 : 0.15;
              return (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{ opacity: op, transition: "opacity 0.3s ease" }}
                >
                  <span
                    className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{ left: c.third.x, top: c.third.y, width: 5, height: 5, background: CONNECTOR_PURPLE }}
                  />
                  <span
                    className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: c.end.x,
                      top: c.end.y,
                      width: 6,
                      height: 6,
                      background: "#fff",
                      border: `1.5px solid ${CONNECTOR_PURPLE}`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* The four screenshots */}
          {HERO_SHOTS.map((shot, i) => (
            <div key={shot.title} className={`relative z-10 ${CORNER[shot.corner].cell}`}>
              <HeroShotCard
                shot={shot}
                priority={shot.corner === "tl" || shot.corner === "tr"}
                delay={CORNER[shot.corner].delay}
                onOpen={() => setOpenIndex(i)}
                onHoverChange={(active) =>
                  setHovered((prev) => (active ? i : prev === i ? null : prev))
                }
                cardRef={(el) => {
                  cardRefs.current[i] = el;
                }}
              />
            </div>
          ))}

          {/* Center node */}
          <div
            ref={centerRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <div
              className="rounded-full bg-white/70 backdrop-blur-xl border border-brand-purple/30 flex flex-col items-center justify-center text-center p-6 w-[220px] h-[220px] lg:w-[256px] lg:h-[256px]"
              style={{ animation: "heroPulse 4s ease-in-out infinite" }}
            >
              <Logo className="h-9 lg:h-10 w-auto" />
              <p className="mt-3 text-subtle px-2 text-xs lg:text-[13px] leading-[1.5]">
                Connect your business and customers through{" "}
                <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent font-medium">
                  one platform
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Below lg — swipeable single-column carousel fallback */}
      <div className="lg:hidden pb-12 mt-2">
        <HeroCarousel shots={HERO_SHOTS} onOpen={setOpenIndex} />
      </div>

      <HeroLightbox
        shots={HERO_SHOTS}
        index={openIndex}
        onNavigate={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
}

function ColumnHeader({
  category,
  children,
}: {
  category: HeroShot["category"];
  children: ReactNode;
}) {
  const accent =
    category === "customer"
      ? "var(--color-brand-blue)"
      : "var(--color-brand-purple)";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border whitespace-nowrap text-[11px] font-semibold tracking-[0.12em] shadow-sm"
      style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`, color: accent }}
    >
      <span>●</span>
      {children}
    </span>
  );
}
