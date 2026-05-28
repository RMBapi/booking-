"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Business, Service } from "@/types";
import { Modal, BookingForm } from "@/components";
import { ELEGANZA } from "@/lib/publicBrand";
import {
  fadeUp,
  fadeIn,
  staggerContainer,
  slideFromLeft,
  slideFromRight,
  VP,
  OPERATING_HOURS,
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
  return (
    <section
      id="bookings"
      className="py-20 px-6 lg:px-16"
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

          {/* Opening Hours */}
          <motion.div
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="rounded p-8"
            style={{
              backgroundColor: ELEGANZA.surface,
              border: `1px solid ${ELEGANZA.border}`,
            }}
          >
            <motion.h3
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="uppercase mb-8 tracking-[0.2em]"
              style={{ fontSize: "1.25rem", color: ELEGANZA.ink }}
            >
              OPENING HOURS
            </motion.h3>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="space-y-0"
            >
              {OPERATING_HOURS.map((item) => (
                <motion.div
                  key={item.day}
                  variants={fadeIn}
                  className="flex justify-between items-center py-4 border-b last:border-0"
                  style={{ borderColor: ELEGANZA.border }}
                >
                  <span
                    className="text-sm font-semibold uppercase tracking-[0.2em]"
                    style={{ color: ELEGANZA.inkMuted }}
                  >
                    {item.day}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        item.hours === "Closed"
                          ? ELEGANZA.inkMuted
                          : ELEGANZA.ink,
                    }}
                  >
                    {item.hours}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
