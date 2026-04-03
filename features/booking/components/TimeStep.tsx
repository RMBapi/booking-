"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { B, DEFAULT_SERVICE_IMAGE, TIME_SLOTS, STEP_TRANSITION } from "../constants";
import type { Provider, ServiceInfo } from "../types";
import { MiniCalendar } from "./MiniCalendar";
import { SafeImage } from "./SafeImage";

interface TimeStepProps {
  service: ServiceInfo;
  heroImageUrl?: string;
  selectedProvider: Provider | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (d: Date) => void;
  onSelectTime: (t: string) => void;
  onConfirm: () => void;
}

export const TimeStep = React.memo(function TimeStep({
  service,
  heroImageUrl,
  selectedProvider,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onConfirm,
}: TimeStepProps) {
  const serviceImage =
    heroImageUrl || service.imageUrl || DEFAULT_SERVICE_IMAGE;

  return (
    <motion.div {...STEP_TRANSITION} key="step-time">
      <h2
        className="font-black uppercase text-white mb-2 tracking-widest"
        style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}
      >
        CHOOSE DATE AND TIME
      </h2>
      <p className="text-sm mb-8" style={{ color: B.muted }}>
        {selectedProvider ? (
          <>
            Booking with{" "}
            <span style={{ color: B.accent }}>{selectedProvider.name}</span> -{" "}
          </>
        ) : (
          <>Booking </>
        )}
        {service.name}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left sidebar - service & provider info */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div
            className="rounded overflow-hidden border"
            style={{ backgroundColor: B.card, borderColor: B.border }}
          >
            <div
              className="relative overflow-hidden"
              style={{ height: "160px" }}
            >
              <SafeImage
                src={serviceImage}
                alt={service.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(44,8,0,0.8) 0%, transparent 50%)",
                }}
              />
            </div>

            <div className="p-5">
              <h3 className="font-black text-white uppercase tracking-wider mb-2">
                {service.name}
              </h3>
              <p
                className="text-xs leading-relaxed mb-4"
                style={{ color: B.muted }}
              >
                {service.description || "Professional service tailored to you."}
              </p>
              <div
                className="flex items-center justify-between pt-3 border-t"
                style={{ borderColor: B.border }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: B.muted }}
                >
                  {service.duration}
                </span>
                <span className="font-black text-white">{service.price}</span>
              </div>
            </div>
          </div>

          {selectedProvider && (
            <div
              className="mt-4 p-4 rounded border flex items-center gap-3"
              style={{ backgroundColor: B.card, borderColor: B.border }}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: "#330A00" }}
              >
                <SafeImage
                  src={selectedProvider.imageUrl}
                  alt={selectedProvider.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {selectedProvider.name}
                </p>
                <p className="text-[10px]" style={{ color: B.accent }}>
                  {selectedProvider.title}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right - calendar and time slots */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
          <MiniCalendar selectedDate={selectedDate} onSelect={onSelectDate} />

          {selectedDate ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white uppercase tracking-widest text-sm">
                  Available Start Times
                </h3>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: B.muted }}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: B.white, opacity: 0.5 }}
                  />
                  Available
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSel = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => onSelectTime(slot)}
                      className="py-2 px-1 rounded border text-xs font-bold transition-all"
                      style={{
                        backgroundColor: isSel ? B.accent : "transparent",
                        color: isSel ? B.dark : B.white,
                        borderColor: isSel
                          ? B.accent
                          : "rgba(255,255,255,0.25)",
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  onClick={onConfirm}
                  disabled={!selectedTime}
                  className="w-full py-4 rounded font-black text-sm uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: selectedTime
                      ? B.cta
                      : "rgba(255,255,255,0.1)",
                    color: selectedTime ? B.white : B.muted,
                    cursor: selectedTime ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTime)
                      e.currentTarget.style.backgroundColor = B.ctaHov;
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTime)
                      e.currentTarget.style.backgroundColor = B.cta;
                  }}
                >
                  Confirm Time
                </button>
              </div>
            </motion.div>
          ) : (
            <div
              className="flex items-center justify-center py-12 rounded border"
              style={{ borderColor: B.border, color: B.muted }}
            >
              <div className="text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  Select a date above
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
