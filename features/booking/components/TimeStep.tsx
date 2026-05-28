"use client";

import React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { B, STEP_TRANSITION } from "../constants";
import type { Provider, ServiceInfo } from "../types";
import type { AvailableSlot } from "@/types";
import { formatSlotTime } from "../utils";
import { MiniCalendar } from "./MiniCalendar";
import { SafeImage } from "./SafeImage";
import { SmartImage } from "@/components";

interface TimeStepProps {
  service: ServiceInfo;
  selectedProvider: Provider | null;
  selectedDate: Date | null;
  selectedSlotStart: string | null;
  availableSlots: AvailableSlot[];
  timeFormat: "12" | "24";
  slotsLoading: boolean;
  slotsError: string | null;
  submitting?: boolean;
  confirmLabel?: string;
  onSelectDate: (d: Date) => void;
  onSelectSlot: (slot: AvailableSlot) => void;
  onConfirm: () => void;
  canSwitchService?: boolean;
  serviceIndex?: number;
  serviceCount?: number;
  onPrevService?: () => void;
  onNextService?: () => void;
}

export const TimeStep = React.memo(function TimeStep({
  service,
  selectedProvider,
  selectedDate,
  selectedSlotStart,
  availableSlots,
  timeFormat,
  slotsLoading,
  slotsError,
  submitting = false,
  confirmLabel = "Confirm Time",
  onSelectDate,
  onSelectSlot,
  onConfirm,
  canSwitchService = false,
  serviceIndex = 0,
  serviceCount = 0,
  onPrevService,
  onNextService,
}: TimeStepProps) {
  const serviceImage = service.imageUrl?.trim();
  const showSwitcher = canSwitchService && serviceCount > 1;
  const servicePosition = `${serviceIndex + 1} / ${serviceCount}`;

  const hasSlots = availableSlots.length > 0;

  return (
    <motion.div {...STEP_TRANSITION}>
      <h2
        className="uppercase mb-2 tracking-[0.2em]"
        style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", color: B.ink }}
      >
        CHOOSE DATE AND TIME
      </h2>
      <p className="text-sm mb-8" style={{ color: B.muted }}>
        {selectedProvider ? (
          <>
            Booking with{" "}
            <span style={{ color: B.ink }}>{selectedProvider.name}</span> -{" "}
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
            {serviceImage && (
              <div className="relative" style={{ height: "160px" }}>
                <SmartImage
                  src={serviceImage}
                  alt={service.name}
                  className="h-full w-full"
                  placeholderColor={B.surfaceMuted}
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(34,34,34,0.5) 0%, transparent 55%)",
                  }}
                />
              </div>
            )}

            <div className="p-5">
              <h3
                className="font-semibold uppercase tracking-[0.12em] mb-2"
                style={{ color: B.ink }}
              >
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
                {service.price && (
                  <span className="font-semibold" style={{ color: B.ink }}>
                    {service.price}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showSwitcher && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onPrevService}
                className="h-9 w-9 rounded-full border flex items-center justify-center transition-colors"
                style={{ borderColor: B.border, color: B.ink }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = B.ink;
                  e.currentTarget.style.color = B.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = B.ink;
                }}
                aria-label="Previous service"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: B.muted }}
              >
                {servicePosition}
              </span>
              <button
                type="button"
                onClick={onNextService}
                className="h-9 w-9 rounded-full border flex items-center justify-center transition-colors"
                style={{ borderColor: B.border, color: B.ink }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = B.ink;
                  e.currentTarget.style.color = B.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = B.ink;
                }}
                aria-label="Next service"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedProvider && (
            <div
              className="mt-4 p-4 rounded border flex items-center gap-3"
              style={{ backgroundColor: B.card, borderColor: B.border }}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: B.surfaceMuted }}
              >
                <SafeImage
                  src={selectedProvider.imageUrl}
                  alt={selectedProvider.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: B.ink }}>
                  {selectedProvider.name}
                </p>
                <p className="text-[10px]" style={{ color: B.muted }}>
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
                <h3
                  className="font-semibold uppercase tracking-[0.2em] text-sm"
                  style={{ color: B.ink }}
                >
                  Available Start Times
                </h3>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: B.muted }}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: B.ink, opacity: 0.3 }}
                  />
                  Available
                </div>
              </div>

              {slotsLoading ? (
                <div
                  className="py-10 text-center text-sm"
                  style={{ color: B.muted }}
                >
                  Loading available slots...
                </div>
              ) : slotsError ? (
                <div
                  className="py-10 text-center text-sm"
                  style={{ color: B.muted }}
                >
                  {slotsError}
                </div>
              ) : hasSlots ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
                  {availableSlots.map((slot, idx) => {
                    const label = formatSlotTime(slot.start, timeFormat);
                    const isSel = selectedSlotStart === slot.start;
                    const disabled = submitting;
                    return (
                      <button
                        key={`${slot.start}-${idx}`}
                        disabled={disabled}
                        onClick={() => onSelectSlot(slot)}
                        className="py-2 px-1 rounded border text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isSel ? B.accent : "transparent",
                          color: isSel ? B.white : B.ink,
                          borderColor: isSel ? B.accent : B.border,
                        }}
                        title={
                          typeof slot.capacity === "number"
                            ? `Capacity: ${slot.capacity}`
                            : undefined
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="py-10 text-center text-sm"
                  style={{ color: B.muted }}
                >
                  No available slots for this date.
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={onConfirm}
                  disabled={!selectedSlotStart || submitting}
                  className="w-full py-4 rounded font-semibold text-sm uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: selectedSlotStart ? B.cta : B.surfaceMuted,
                    color: selectedSlotStart ? B.white : B.muted,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSlotStart && !submitting)
                      e.currentTarget.style.backgroundColor = B.ctaHov;
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSlotStart && !submitting)
                      e.currentTarget.style.backgroundColor = B.cta;
                  }}
                >
                  {submitting ? (
                    <>
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: "rgba(34,34,34,0.2)",
                          borderTopColor: B.white,
                        }}
                      />
                      Confirming...
                    </>
                  ) : (
                    confirmLabel
                  )}
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
