import React from "react";
import { Star } from "lucide-react";
import { BRAND } from "@/lib/publicBrand";
import { MOCK_REVIEWS } from "../_constants";

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="py-20 px-6 lg:px-16"
      style={{ backgroundColor: BRAND.darker }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p
            className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
            style={{ color: BRAND.accent }}
          >
            Client Reviews
          </p>
          <h2
            className="font-black uppercase text-white"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "0.05em" }}
          >
            WHAT THEY SAY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_REVIEWS.map((review) => (
            <div
              key={review.name}
              className="p-8 rounded transition-transform duration-300 hover:-translate-y-1.5"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
