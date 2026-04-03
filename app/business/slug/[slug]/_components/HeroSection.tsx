"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Business, Service } from "@/types";
import { Modal, BookingForm } from "@/components";
import { BRAND } from "@/lib/publicBrand";
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
      className="relative h-[90vh] w-full flex items-end pb-20 px-8 lg:px-20 overflow-hidden"
    >
      <motion.div className="absolute inset-0 z-0" style={{ y: imgY }}>
        <img
          src={heroImage}
          alt={`${business.name} hero`}
          className="w-full h-full object-cover"
          style={{ willChange: "transform" }}
        />
      </motion.div>
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to top, ${BRAND.darker}EE 0%, ${BRAND.dark}99 40%, transparent 70%)`,
        }}
      />
      <motion.div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: "rgba(44,8,0,1)", opacity: overlayOpacity }}
      />

      <div className="relative z-10 w-full">
        <motion.div variants={heroStagger} initial="hidden" animate="visible">
          <motion.h1
            variants={heroChild}
            className="font-black uppercase text-white mb-8 leading-none"
            style={{
              fontSize: "clamp(3rem, 8vw, 7rem)",
              letterSpacing: "0.04em",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
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
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {business.description}
            </motion.p>
          )}

          <motion.div variants={heroChild} className="flex flex-wrap gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress || business.name)}`}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3 rounded text-sm font-bold uppercase tracking-widest border-2 border-white text-white bg-transparent transition-all hover:bg-white hover:text-brand-dark"
            >
              Show on Map
            </a>

            {featuredService ? (
              <Modal>
                <Modal.Open opens="hero-book-now">
                  <button
                    className="px-8 py-3 rounded text-white text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ backgroundColor: BRAND.cta }}
                  >
                    Book Now
                  </button>
                </Modal.Open>
                <Modal.Body name="hero-book-now" size="full" className="w-full max-w-6xl p-0">
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
                className="px-8 py-3 rounded text-white text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110"
                style={{ backgroundColor: BRAND.cta }}
                onClick={() =>
                  document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })
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
