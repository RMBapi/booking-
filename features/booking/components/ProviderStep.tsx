"use client";

import React from "react";
import { motion } from "framer-motion";
import { B, STEP_TRANSITION } from "../constants";
import type { Provider, ServiceInfo } from "../types";
import { SafeImage } from "./SafeImage";
import { ProviderSilhouette } from "./ProviderSilhouette";

interface ProviderStepProps {
  service: ServiceInfo;
  providers: Provider[];
  loading?: boolean;
  onSelect: (provider: Provider) => void;
}

export const ProviderStep = React.memo(function ProviderStep({
  service,
  providers,
  loading,
  onSelect,
}: ProviderStepProps) {
  return (
    <motion.div {...STEP_TRANSITION}>
      <div>
        <h2
          className="font-black uppercase text-white mb-2 tracking-widest"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}
        >
          SELECT YOUR PROVIDER
        </h2>
        <p className="text-sm mb-10" style={{ color: B.muted }}>
          Choose a provider for your{" "}
          <span style={{ color: B.accent }}>{service.name}</span> appointment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div
                key={`skel-${i}`}
                className="flex flex-col rounded overflow-hidden border animate-pulse"
                style={{ backgroundColor: B.card, borderColor: B.border }}
              >
                <div
                  style={{
                    height: "220px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                  }}
                />
                <div className="p-6">
                  <div
                    className="h-4 w-2/3 rounded mb-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                  />
                  <div
                    className="h-3 w-1/3 rounded mb-6"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  />
                  <div
                    className="h-10 rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  />
                </div>
              </div>
            ))
          : providers.map((provider) => (
          <motion.div
            key={provider.id}
            whileHover={{ y: -4 }}
            className="flex flex-col rounded overflow-hidden border transition-all cursor-pointer group"
            style={{ backgroundColor: B.card, borderColor: B.border }}
            onClick={() => onSelect(provider)}
          >
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: "#330A00", height: "220px" }}
            >
              {provider.imageUrl ? (
                <SafeImage
                  src={provider.imageUrl}
                  alt={provider.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <ProviderSilhouette />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(44,8,0,0.6) 0%, transparent 50%)",
                }}
              />
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <h3 className="font-black text-white uppercase tracking-wider mb-1">
                  {provider.name}
                </h3>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: B.accent }}
                >
                  {provider.title}
                </p>
              </div>
              <button
                className="w-full py-3 rounded border text-sm font-bold uppercase tracking-widest transition-all"
                style={{
                  borderColor: "rgba(255,255,255,0.35)",
                  color: B.white,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = B.white;
                  e.currentTarget.style.color = B.dark;
                  e.currentTarget.style.borderColor = B.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = B.white;
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(provider);
                }}
              >
                Select
              </button>
            </div>
          </motion.div>
        ))}
        </div>
      </div>
    </motion.div>
  );
});
