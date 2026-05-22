"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Business, Service } from "@/types";
import { Modal, BookingForm } from "@/components";
import { BRAND } from "@/lib/publicBrand";
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
  slug: string;
  heroImage: string;
}

export function ContactSection({
  business,
  displayAddress,
  displayPhone,
  displayEmail,
  featuredService,
  slug,
  heroImage,
}: ContactSectionProps) {
  return (
    <section
      id="bookings"
      className="py-20 px-6 lg:px-16"
      style={{ backgroundColor: BRAND.dark }}
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
                className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: BRAND.accent }}
              >
                Find Us
              </motion.p>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                custom={1}
                viewport={VP}
                className="font-black uppercase text-white"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.05em" }}
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
                <motion.div key={label} variants={fadeUp} className="flex items-center gap-5">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: BRAND.card }}
                  >
                    <Icon className="w-5 h-5" style={{ color: BRAND.accent }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {label}
                    </p>
                    <p className="text-white font-medium text-sm">{value}</p>
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
                      className="flex items-center gap-3 px-8 py-4 rounded text-white font-bold text-sm uppercase tracking-widest transition-all hover:brightness-110"
                      style={{ backgroundColor: BRAND.cta }}
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
                  className="flex items-center gap-3 px-8 py-4 rounded text-white font-bold text-sm uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ backgroundColor: BRAND.cta }}
                  onClick={() =>
                    document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" })
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
            style={{ backgroundColor: BRAND.card }}
          >
            <motion.h3
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VP}
              className="font-black uppercase text-white mb-8 tracking-widest"
              style={{ fontSize: "1.25rem" }}
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
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <span
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {item.day}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: item.hours === "Closed" ? "rgba(255,255,255,0.3)" : "white",
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
