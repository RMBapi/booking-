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
          className="uppercase mb-2 tracking-[0.2em]"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", color: B.ink }}
        >
          SELECT YOUR PROVIDER
        </h2>
        <p className="text-sm mb-10" style={{ color: B.muted }}>
          Choose a provider for your{" "}
          <span style={{ color: B.ink }}>{service.name}</span> appointment.
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
                      backgroundColor: B.surfaceMuted,
                    }}
                  />
                  <div className="p-6">
                    <div
                      className="h-4 w-2/3 rounded mb-2"
                      style={{ backgroundColor: B.surfaceMuted }}
                    />
                    <div
                      className="h-3 w-1/3 rounded mb-6"
                      style={{ backgroundColor: B.surfaceMuted }}
                    />
                    <div
                      className="h-10 rounded"
                      style={{ backgroundColor: B.surfaceMuted }}
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
                    style={{ backgroundColor: B.surfaceMuted, height: "220px" }}
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
                          "linear-gradient(to top, rgba(34,34,34,0.35) 0%, transparent 55%)",
                      }}
                    />
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    <div>
                      <h3
                        className="font-semibold uppercase tracking-[0.12em] mb-1"
                        style={{ color: B.ink }}
                      >
                        {provider.name}
                      </h3>
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color: B.muted }}
                      >
                        {provider.title}
                      </p>
                    </div>
                    <button
                      className="w-full py-3 rounded border text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
                      style={{
                        borderColor: B.ink,
                        color: B.ink,
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = B.ink;
                        e.currentTarget.style.color = B.white;
                        e.currentTarget.style.borderColor = B.ink;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = B.ink;
                        e.currentTarget.style.borderColor = B.ink;
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
