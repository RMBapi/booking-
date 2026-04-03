"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BRAND } from "@/lib/publicBrand";
import { fadeUp, staggerContainer, scaleUp, VP, MOCK_REVIEWS } from "../_constants";

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="py-20 px-6 lg:px-16"
      style={{ backgroundColor: BRAND.darker }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="mb-12"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
            style={{ color: BRAND.accent }}
          >
            Client Reviews
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="font-black uppercase text-white"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.05em" }}
          >
            WHAT THEY SAY
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {MOCK_REVIEWS.map((review) => (
            <motion.div
              key={review.name}
              variants={scaleUp}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="p-8 rounded"
              style={{ backgroundColor: BRAND.card }}
            >
              <div className="flex mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: BRAND.accent }} />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{review.name}</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {review.date}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
