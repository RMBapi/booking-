"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { B } from "../constants";
import type { Provider, ServiceInfo } from "../types";

const DISMISS_SECONDS = 10;

interface SuccessViewProps {
  service: ServiceInfo;
  selectedProvider: Provider | null;
  dateStr: string;
  selectedTime: string | null;
  onDismiss: () => void;
}

export const SuccessView = React.memo(function SuccessView({
  service,
  selectedProvider,
  dateStr,
  selectedTime,
  onDismiss,
}: SuccessViewProps) {
  const [remaining, setRemaining] = useState(DISMISS_SECONDS);

  const stableOnDismiss = useCallback(onDismiss, [onDismiss]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stableOnDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stableOnDismiss]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6 text-center px-10 py-12 rounded-2xl max-w-md mx-4 overflow-hidden"
        style={{ backgroundColor: B.card }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: DISMISS_SECONDS, ease: "linear" }}
            className="h-full"
            style={{ backgroundColor: B.cta }}
          />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: B.cta }}
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>

        <h2
          className="font-black uppercase text-white tracking-widest"
          style={{ fontSize: "1.6rem" }}
        >
          BOOKING CONFIRMED
        </h2>

        <p style={{ color: B.muted }} className="text-sm max-w-sm">
          Your appointment
          {selectedProvider && (
            <>
              {" "}
              with{" "}
              <strong style={{ color: B.white }}>
                {selectedProvider.name}
              </strong>
            </>
          )}{" "}
          for <strong style={{ color: B.white }}>{service.name}</strong> on
          <strong style={{ color: B.white }}> {dateStr}</strong> at
          <strong style={{ color: B.white }}> {selectedTime}</strong> is
          confirmed.
        </p>

        <p style={{ color: B.muted }} className="text-xs">
          Closing in {remaining}s
        </p>
      </motion.div>
    </div>
  );
});
