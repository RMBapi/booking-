"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Business, Service } from "@/types";
import { Modal, BookingForm } from "@/components";
import { ELEGANZA } from "@/lib/publicBrand";
import { EASE_OUT_QUART } from "../_constants";

interface HeroSectionProps {
  business: Business;
  heroImage: string;
  displayAddress: string;
  featuredService: Service | undefined;
  slug: string;
}

export function HeroSection({
  business,
  heroImage,
  displayAddress,
  featuredService,
  slug,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.45, 0.75]);

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
      className="relative min-h-[85vh] w-full flex items-end pb-24 px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      <motion.div className="absolute inset-0 z-0" style={{ y: imgY }}>
        <Image
          src={heroImage}
          alt={`${business.name} hero`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ willChange: "transform" }}
        />
      </motion.div>
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to top, rgba(34,34,34,0.8) 0%, rgba(34,34,34,0.55) 45%, rgba(34,34,34,0.1) 75%)",
        }}
      />
      <motion.div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: "rgba(34,34,34,1)", opacity: overlayOpacity }}
      />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(221,211,207,0.35), transparent 55%)",
        }}
      />

      <div className="relative z-10 w-full">
        <motion.div variants={heroStagger} initial="hidden" animate="visible">
          <motion.h1
            variants={heroChild}
            className="font-[var(--font-display)] uppercase text-white mb-8 leading-none"
            style={{
              fontSize: "clamp(3rem, 4vw, 7rem)",
              letterSpacing: "0.06em",
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
              className="max-w-xl text-lg font-medium leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              {business.description}
            </motion.p>
          )}

          <motion.div variants={heroChild} className="flex flex-wrap gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || business.name)}`}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border border-white/70 text-white bg-transparent transition-colors hover:bg-white hover:text-[#222222]"
            >
              Show on Map
            </a>

            {featuredService ? (
              <Modal>
                <Modal.Open opens="hero-book-now">
                  <button
                    className="px-8 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
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
                className="px-8 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
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
