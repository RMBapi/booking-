"use client";

import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { B } from "../constants";
import type { Provider, ServiceInfo } from "../types";

interface SuccessViewProps {
  service: ServiceInfo;
  selectedProvider: Provider | null;
  dateStr: string;
  selectedTime: string | null;
}

export const SuccessView = React.memo(function SuccessView({
  service,
  selectedProvider,
  dateStr,
  selectedTime,
}: SuccessViewProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: B.dark }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6 text-center px-6"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: B.cta }}
        >
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2
          className="font-black uppercase text-white tracking-widest"
          style={{ fontSize: "2rem" }}
        >
          BOOKING CONFIRMED
        </h2>
        <p style={{ color: B.muted }} className="text-sm max-w-sm">
          Your appointment
          {selectedProvider && (
            <>
              {" "}
              with{" "}
              <strong style={{ color: B.white }}>{selectedProvider.name}</strong>
            </>
          )}{" "}
          for <strong style={{ color: B.white }}>{service.name}</strong> on
          <strong style={{ color: B.white }}> {dateStr}</strong> at
          <strong style={{ color: B.white }}> {selectedTime}</strong> is
          confirmed.
        </p>
        <p style={{ color: B.muted }} className="text-xs">
          Redirecting...
        </p>
      </motion.div>
    </div>
  );
});
