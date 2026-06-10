"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Business, Service } from "@/types";
import { Modal } from "@/components";
import { ELEGANZA } from "@/lib/publicBrand";
import { ContactForm } from "./ContactForm";

// Lazily loaded — the booking modal contents aren't part of first paint.
const BookingForm = dynamic(
  () => import("@/features/booking/BookingForm").then((m) => m.BookingForm),
  { ssr: false },
);
import {
  fadeUp,
  fadeIn,
  staggerContainer,
  slideFromLeft,
  VP,
  buildOpeningHoursWeek,
} from "../_constants";

interface ContactSectionProps {
  business: Business;
  displayAddress: string;
  displayPhone: string;
  displayEmail: string;
  featuredService: Service | undefined;
  services?: Service[];
  slug: string;
  heroImage: string;
}

export function ContactSection({
  business,
  displayAddress,
  displayPhone,
  displayEmail,
  featuredService,
  services,
  slug,
  heroImage,
}: ContactSectionProps) {
  const week = buildOpeningHoursWeek(business.openingHours);

  // Current day/time, resolved on the client only — reading Date during render
  // would desync SSR and trigger a hydration mismatch. Refreshes each minute so
  // the "currently open" status stays accurate.
  const [now, setNow] = useState<{ dayIndex: number; minutes: number } | null>(
    null,
  );
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      // JS getDay(): 0=Sun…6=Sat → our index: 0=Mon…6=Sun.
      setNow({
        dayIndex: (d.getDay() + 6) % 7,
        minutes: d.getHours() * 60 + d.getMinutes(),
      });
    };
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const today = now ? week[now.dayIndex] : null;
  const openStatus = (() => {
    if (!now || !today) return null;
    if (
      today.isOpen &&
      today.openMin != null &&
      today.closeMin != null &&
      now.minutes >= today.openMin &&
      now.minutes < today.closeMin
    ) {
      return { label: "Currently Open", open: true };
    }
    if (today.isOpen && today.openMin != null && now.minutes < today.openMin) {
      return { label: `Opens ${today.open}`, open: false };
    }
    return { label: "Closed Now", open: false };
  })();

  return (
    <section
      id="bookings"
      className="py-20 px-6 lg:px-16 scroll-mt-24 lg:scroll-mt-28"
      style={{
        backgroundColor: ELEGANZA.background,
        backgroundImage: "linear-gradient(180deg, #efefef 0%, #fafafa 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <motion.div
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="space-y-10"
          >
            <div>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VP}
                className="text-xs font-semibold uppercase tracking-[0.4em] mb-3"
                style={{ color: ELEGANZA.inkMuted }}
              >
                Find Us
              </motion.p>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                custom={1}
                viewport={VP}
                className="uppercase"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  letterSpacing: "0.08em",
                  color: ELEGANZA.ink,
                }}
              >
                VISIT US
              </motion.h2>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="space-y-6"
            >
              {[
                { icon: MapPin, label: "Address", value: displayAddress },
                { icon: Phone, label: "Phone", value: displayPhone },
                { icon: Mail, label: "Email", value: displayEmail },
              ].map(({ icon: Icon, label, value }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  className="flex items-center gap-5"
                >
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: ELEGANZA.surface,
                      border: `1px solid ${ELEGANZA.border}`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: ELEGANZA.ink }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-0.5"
                      style={{ color: ELEGANZA.inkMuted }}
                    >
                      {label}
                    </p>
                    <p
                      className="font-medium text-sm"
                      style={{ color: ELEGANZA.ink }}
                    >
                      {value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              custom={2}
              viewport={VP}
            >
              {featuredService ? (
                <Modal>
                  <Modal.Open opens="contact-book-now">
                    <button
                      className="flex items-center gap-3 px-8 py-4 rounded text-white font-semibold text-sm uppercase tracking-[0.2em] transition-colors"
                      style={{ backgroundColor: ELEGANZA.cta }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          ELEGANZA.ctaHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = ELEGANZA.cta;
                      }}
                    >
                      Book Your Appointment
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Modal.Open>
                  <Modal.Body
                    name="contact-book-now"
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
                  className="flex items-center gap-3 px-8 py-4 rounded text-white font-semibold text-sm uppercase tracking-[0.2em] transition-colors"
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
                  Browse Services
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </motion.div>

          {/* Send a message — public contact form, available to everyone */}
          <ContactForm
            services={services}
            slug={slug}
            businessId={business.id}
          />
        </div>

        {/* Opening Hours — full-width week grid, matched to the site palette */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="rounded-2xl p-4 sm:p-6 md:p-8 mt-12"
          style={{
            backgroundColor: ELEGANZA.surface,
            border: `1px solid ${ELEGANZA.border}`,
          }}
        >
          {/* Header + live status */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-7">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ELEGANZA.surfaceMuted }}
              >
                <Clock className="w-5 h-5" style={{ color: ELEGANZA.accent }} />
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  When to find us
                </p>
                <h3
                  className="uppercase tracking-[0.18em] leading-tight"
                  style={{ fontSize: "1.2rem", color: ELEGANZA.ink }}
                >
                  Opening Hours
                </h3>
              </div>
            </div>

            {openStatus && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: openStatus.open
                    ? "rgba(129,123,100,0.12)"
                    : ELEGANZA.surfaceMuted,
                  border: `1px solid ${
                    openStatus.open ? ELEGANZA.accent : ELEGANZA.border
                  }`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: openStatus.open
                      ? ELEGANZA.accent
                      : ELEGANZA.inkMuted,
                    boxShadow: openStatus.open
                      ? `0 0 0 3px rgba(129,123,100,0.20)`
                      : "none",
                  }}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: openStatus.open ? ELEGANZA.ink : ELEGANZA.inkMuted,
                  }}
                >
                  {openStatus.label}
                </span>
              </div>
            )}
          </div>

          {/* Week grid — all 7 days in a single equal-width row */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="grid grid-cols-7 gap-1.5 sm:gap-3"
          >
            {week.map((d) => {
              const isToday = now != null && d.index === now.dayIndex;
              const dayColor = isToday
                ? "rgba(255,255,255,0.85)"
                : ELEGANZA.inkMuted;
              const labelColor = isToday
                ? "rgba(255,255,255,0.65)"
                : ELEGANZA.inkMuted;
              const timeColor = isToday ? "#ffffff" : ELEGANZA.ink;
              return (
                <motion.div
                  key={d.key}
                  variants={fadeIn}
                  className="relative"
                >
                  {isToday && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded shadow-sm"
                      style={{ backgroundColor: ELEGANZA.ink, color: "#ffffff" }}
                    >
                      Today
                    </span>
                  )}
                  <div
                    className="h-full flex flex-col rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: isToday
                        ? ELEGANZA.accent
                        : ELEGANZA.surfaceMuted,
                      border: `1px solid ${
                        isToday ? ELEGANZA.accent : ELEGANZA.border
                      }`,
                      opacity: !isToday && !d.isOpen ? 0.85 : 1,
                    }}
                  >
                    {/* Day header */}
                    <div
                      className="py-2 sm:py-2.5 text-center"
                      style={{
                        borderBottom: `1px solid ${
                          isToday ? "rgba(255,255,255,0.22)" : ELEGANZA.border
                        }`,
                      }}
                    >
                      <span
                        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.08em] sm:tracking-[0.22em]"
                        style={{ color: dayColor }}
                      >
                        {d.short}
                      </span>
                    </div>

                    {/* Body: clearly labelled open / close */}
                    <div className="flex-1 flex flex-col items-center justify-center px-1 sm:px-2 py-3 sm:py-4">
                      {d.isOpen ? (
                        <div className="w-full text-center space-y-2 sm:space-y-3">
                          <div>
                            <p
                              className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.18em] mb-0.5 sm:mb-1"
                              style={{ color: labelColor }}
                            >
                              Open
                            </p>
                            <p
                              className="text-[11px] sm:text-sm font-bold leading-tight"
                              style={{ color: timeColor }}
                            >
                              {d.open}
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.18em] mb-0.5 sm:mb-1"
                              style={{ color: labelColor }}
                            >
                              Close
                            </p>
                            <p
                              className="text-[11px] sm:text-sm font-bold leading-tight"
                              style={{ color: timeColor }}
                            >
                              {d.close}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              border: `1.5px solid ${
                                isToday
                                  ? "rgba(255,255,255,0.6)"
                                  : ELEGANZA.inkMuted
                              }`,
                            }}
                          />
                          <span
                            className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.18em]"
                            style={{ color: labelColor }}
                          >
                            Closed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <p
            className="text-center text-xs mt-6"
            style={{ color: ELEGANZA.inkMuted }}
          >
            Appointments recommended · Hours may vary on public holidays
          </p>
        </motion.div>
      </div>
    </section>
  );
}
