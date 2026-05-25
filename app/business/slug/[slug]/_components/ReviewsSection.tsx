import React from "react";
import { Star } from "lucide-react";
import { ELEGANZA } from "@/lib/publicBrand";
import { MOCK_REVIEWS } from "../_constants";

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      className="py-20 px-6 lg:px-16"
      style={{
        backgroundColor: ELEGANZA.surfaceMuted,
        backgroundImage:
          "radial-gradient(circle at 10% 10%, rgba(221,211,207,0.35), transparent 55%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-[0.4em] mb-3"
            style={{ color: ELEGANZA.inkMuted }}
          >
            Client Reviews
          </p>
          <h2
            className="uppercase"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              letterSpacing: "0.08em",
              color: ELEGANZA.ink,
            }}
          >
            WHAT THEY SAY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_REVIEWS.map((review) => (
            <div
              key={review.name}
              className="p-8 rounded transition-transform duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: ELEGANZA.surface,
                border: `1px solid ${ELEGANZA.border}`,
              }}
            >
              <div className="flex mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-current"
                    style={{ color: ELEGANZA.inkSoft }}
                  />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: ELEGANZA.inkMuted }}
              >
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold text-sm"
                  style={{ color: ELEGANZA.ink }}
                >
                  {review.name}
                </span>
                <span className="text-xs" style={{ color: ELEGANZA.inkMuted }}>
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
