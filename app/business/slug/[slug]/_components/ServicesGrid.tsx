"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Service, Business } from "@/types";
import { Modal, BookingForm, SmartImage } from "@/components";
import { ELEGANZA } from "@/lib/publicBrand";
import { isServicePriceVisible } from "@/features/booking/utils";
import { fadeUp, staggerContainer, scaleUp, VP } from "../_constants";
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
      style={{
        backgroundColor: ELEGANZA.background,
        backgroundImage: "linear-gradient(180deg, #fafafa 0%, #efefef 100%)",
      }}
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
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: ELEGANZA.inkMuted }}
          >
            {services.length} service{services.length !== 1 ? "s" : ""}{" "}
            available
          </span>
        </motion.div>

        {services.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="rounded p-12 text-center"
            style={{
              backgroundColor: ELEGANZA.surface,
              border: `1px solid ${ELEGANZA.border}`,
            }}
          >
            <p
              className="text-xl font-semibold"
              style={{ color: ELEGANZA.ink }}
            >
              No active services available right now.
            </p>
            <p className="mt-2" style={{ color: ELEGANZA.inkMuted }}>
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
            {services.map((service) => {
              const price = Number(service.price);
              const desc = serviceDescription(service);
              const serviceImg = service.image?.trim();

              return (
                <motion.div
                  key={service.id}
                  variants={scaleUp}
                  className="flex flex-col rounded overflow-hidden"
                  style={{
                    backgroundColor: ELEGANZA.surface,
                    border: `1px solid ${ELEGANZA.border}`,
                  }}
                >
                  {serviceImg && (
                    <SmartImage
                      src={serviceImg}
                      alt={service.name}
                      className="h-48"
                      placeholderColor={ELEGANZA.surfaceMuted}
                    />
                  )}

                  <div className="flex flex-col flex-1 p-5">
                    <h3
                      className="font-semibold mb-2"
                      style={{ fontSize: "1rem", color: ELEGANZA.ink }}
                    >
                      {titleCase(service.name)}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-1"
                      style={{ color: ELEGANZA.inkMuted }}
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
                          setExpandedService(
                            expandedService === service.id ? null : service.id,
                          )
                        }
                        className="text-xs font-semibold text-left mb-3 transition-colors underline"
                        style={{ color: ELEGANZA.ink }}
                      >
                        {expandedService === service.id
                          ? "Read less"
                          : "Read more"}
                      </button>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 mb-4">
                      <span
                        className="text-sm"
                        style={{ color: ELEGANZA.inkMuted }}
                      >
                        {getServiceDuration(service)}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: ELEGANZA.ink }}
                      >
                        {isServicePriceVisible(service)
                          ? formatPrice(price)
                          : "Custom"}
                      </span>
                    </div>

                    <Modal>
                      <Modal.Open opens={`booking-${service.id}`}>
                        <button
                          className="w-full py-3 rounded text-sm font-semibold uppercase tracking-[0.2em] border transition-colors"
                          style={{
                            borderColor: ELEGANZA.ink,
                            color: ELEGANZA.ink,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              ELEGANZA.ink;
                            e.currentTarget.style.color = ELEGANZA.surface;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = ELEGANZA.ink;
                          }}
                        >
                          Select
                        </button>
                      </Modal.Open>
                      <Modal.Body
                        name={`booking-${service.id}`}
                        size="full"
                        className="w-full max-w-6xl p-0"
                        hideDefaultClose
                      >
                        <BookingForm
                          service={service}
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
