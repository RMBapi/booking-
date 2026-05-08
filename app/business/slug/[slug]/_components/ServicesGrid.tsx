"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Service, Business } from "@/types";
import { Modal, BookingForm } from "@/components";
import { BRAND } from "@/lib/publicBrand";
import {
  fadeUp,
  staggerContainer,
  scaleUp,
  VP,
  SERVICE_FALLBACK_IMAGES,
} from "../_constants";
import {
  formatPrice,
  getServiceDuration,
  titleCase,
  serviceDescription,
} from "../_utils";

interface ServicesGridProps {
  services: Service[];
  business: Business;
  slug: string;
  heroImage: string;
}

export function ServicesGrid({
  services,
  business,
  slug,
  heroImage,
}: ServicesGridProps) {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  return (
    <section
      id="services-section"
      className="py-16 px-6 lg:px-16"
      style={{ backgroundColor: BRAND.dark }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="flex justify-end mb-8"
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {services.length} service{services.length !== 1 ? "s" : ""} available
          </span>
        </motion.div>

        {services.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="rounded p-12 text-center"
            style={{ backgroundColor: BRAND.card }}
          >
            <p className="text-xl font-bold text-white">
              No active services available right now.
            </p>
            <p className="mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              Please check back soon.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service, idx) => {
              const price = Number(service.price);
              const desc = serviceDescription(service);
              const fallbackImg = SERVICE_FALLBACK_IMAGES[idx % SERVICE_FALLBACK_IMAGES.length];
              const serviceImg =
                (service as Service & { imageUrl?: string }).imageUrl || fallbackImg;

              return (
                <motion.div
                  key={service.id}
                  variants={scaleUp}
                  className="flex flex-col rounded overflow-hidden"
                  style={{ backgroundColor: BRAND.card }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={serviceImg}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="font-bold text-white mb-2" style={{ fontSize: "1rem" }}>
                      {titleCase(service.name)}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-1"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {expandedService === service.id
                        ? desc
                        : desc.length > 90
                          ? desc.slice(0, 90) + "..."
                          : desc}
                    </p>
                    {desc.length > 90 && (
                      <button
                        onClick={() =>
                          setExpandedService(expandedService === service.id ? null : service.id)
                        }
                        className="text-xs font-bold text-left mb-3 transition-colors"
                        style={{ color: BRAND.accent }}
                      >
                        {expandedService === service.id ? "Read less" : "Read more"}
                      </button>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 mb-4">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {getServiceDuration(service)}
                      </span>
                      <span className="font-bold text-white">
                        {service.priceDisplayMode ? formatPrice(price) : "Custom"}
                      </span>
                    </div>

                    <Modal>
                      <Modal.Open opens={`booking-${service.id}`}>
                        <button className="w-full py-3 rounded text-sm font-bold uppercase tracking-widest border border-white/40 text-white bg-transparent transition-all hover:bg-white hover:text-brand-dark hover:border-white">
                          Select
                        </button>
                      </Modal.Open>
                      <Modal.Body
                        name={`booking-${service.id}`}
                        size="full"
                        className="w-full max-w-6xl p-0"
                      >
                        <BookingForm
                          service={service}
                          businessSlug={slug}
                          businessId={business.id}
                          heroImageUrl={heroImage}
                          businessName={business.name}
                          onClose={() => {}}
                          variant="dark"
                        />
                      </Modal.Body>
                    </Modal>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
