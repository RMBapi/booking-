"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Business, Service } from "@/types";
import { Modal, BookingForm, SmartImage } from "@/components";
import { ELEGANZA, HERO_FALLBACK, getImageUrl } from "@/lib/publicBrand";
import { isVideoUrl } from "@/lib/media";
import { EASE_OUT_QUART } from "../_constants";

interface HeroSectionProps {
  business: Business;
  heroImage: string;
  displayAddress: string;
  featuredService: Service | undefined;
  services?: Service[];
  slug: string;
}

const HERO_TEXT_SHADOW = "0 2px 8px rgba(0,0,0,0.35)";

const CINEMATIC_OVERLAY =
  "linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0) 100%)";

export function HeroSection({
  business,
  heroImage,
  displayAddress,
  featuredService,
  services,
  slug,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  // Still image shown before a hero video plays (and if it fails to load).
  const heroPoster =
    getImageUrl(business.logoUrl) ||
    getImageUrl(business.logo) ||
    HERO_FALLBACK;

  const heroStagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };

  const heroChild: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: EASE_OUT_QUART },
    },
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className="hero-section relative min-h-[85vh] w-full flex items-end pb-16 md:pb-20 px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      {/* Sharp hero media — slight brightness reduction only */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: imgY, filter: "brightness(0.82)" }}
      >
        {isVideoUrl(heroImage) ? (
          <SmartImage
            src={heroImage}
            alt={`${business.name} hero`}
            className="hero-video-media absolute inset-0 w-full h-full"
            placeholderColor={ELEGANZA.inkSoft}
            videoPlayback="autoplay"
            coverTolerance={1}
            poster={heroPoster}
            deferVideo
          />
        ) : (
          <Image
            src={heroImage}
            alt={`${business.name} hero`}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="hero-image-media object-cover focus-subject"
            style={{
              willChange: "transform",
              // Desktop focal point (unchanged); mobile shifts toward the
              // model's face on narrow portrait screens.
              "--focus-x": "20%",
              "--focus-y": "32%",
              "--focus-x-mobile": "18%",
              "--focus-y-mobile": "50%",
            } as React.CSSProperties}
          />
        )}
      </motion.div>

      {/* Mobile: vertical gradient for portrait readability */}
      <div className="hero-overlay-mobile pointer-events-none absolute inset-0 z-[1] md:hidden" />

      {/* Desktop: premium cinematic gradient — left dark, right clear */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        style={{ background: CINEMATIC_OVERLAY }}
      />

      {/* Text content — lower-left glass panel */}
      <div className="hero-content-wrap relative z-10 w-full max-w-[480px] mr-auto mb-2 md:mb-4">
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="hero-glass-panel md:rounded-[20px] md:px-8 md:py-9"
        >
          <motion.h1
            variants={heroChild}
            className="hero-heading font-[var(--font-display)] uppercase text-white mb-5 md:mb-6 leading-none"
            style={{
              textShadow: HERO_TEXT_SHADOW,
            }}
          >
            {business.name.split(" ").map((word, i) => (
              <React.Fragment key={i}>
                {word}
                {i < business.name.split(" ").length - 1 && <br />}
              </React.Fragment>
            ))}
          </motion.h1>

          {business.description && (
            <motion.p
              variants={heroChild}
              className="hero-lead text-base md:text-lg font-medium leading-relaxed mb-6 md:mb-8"
              style={{
                color: "rgba(255,255,255,0.88)",
                textShadow: HERO_TEXT_SHADOW,
              }}
            >
              {business.description}
            </motion.p>
          )}

          <motion.div
            variants={heroChild}
            className="hero-actions flex flex-wrap gap-3 md:gap-4"
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || business.name)}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 md:px-8 py-2.5 md:py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border border-white/70 text-white bg-transparent transition-colors hover:bg-white hover:text-[#222222]"
            >
              Show on Map
            </a>

            {featuredService ? (
              <Modal>
                <Modal.Open opens="hero-book-now">
                  <button
                    className="px-6 md:px-8 py-2.5 md:py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
                    style={{ backgroundColor: ELEGANZA.cta }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ELEGANZA.cta;
                    }}
                  >
                    Book Now
                  </button>
                </Modal.Open>
                <Modal.Body
                  name="hero-book-now"
                  size="full"
                  className="w-full max-w-6xl p-0"
                  hideDefaultClose
                >
                  <BookingForm
                    service={featuredService}
                    services={services}
                    businessSlug={slug}
                    businessId={business.id}
                    heroImageUrl={heroImage}
                    businessName={business.name}
                    onClose={() => {}}
                    variant="dark"
                  />
                </Modal.Body>
              </Modal>
            ) : (
              <button
                className="px-6 md:px-8 py-2.5 md:py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
                style={{ backgroundColor: ELEGANZA.cta }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ELEGANZA.cta;
                }}
                onClick={() =>
                  document
                    .getElementById("services-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Book Now
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
