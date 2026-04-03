"use client";

import React from "react";
import { B } from "../constants";
import type { Step, StepMeta } from "../types";

interface StepBarProps {
  steps: StepMeta[];
  activeStep: Step;
  completedSteps: Step[];
}

export const StepBar = React.memo(function StepBar({
  steps,
  activeStep,
  completedSteps,
}: StepBarProps) {
  return (
    <div
      className="w-full border-b"
      style={{ backgroundColor: B.card, borderColor: B.border }}
    >
      <div className="max-w-5xl mx-auto flex items-stretch">
        <div
          className="flex-1 relative flex flex-col items-center justify-center py-4 px-2"
          style={{ borderRight: `1px solid ${B.border}` }}
        >
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: B.accent }}
          >
            SERVICES
          </span>
          <span
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: B.accent }}
          />
        </div>

        {steps.map((s, i) => {
          const isActive = s.key === activeStep;
          const isDone = completedSteps.includes(s.key);
          return (
            <div
              key={s.key}
              className="flex-1 relative flex flex-col items-center justify-center py-4 px-2"
              style={{
                borderRight:
                  i < steps.length - 1 ? `1px solid ${B.border}` : undefined,
              }}
            >
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{
                  color: isActive
                    ? B.accent
                    : isDone
                      ? "rgba(255,255,255,0.75)"
                      : B.muted,
                }}
              >
                {s.label}
              </span>
              {s.sub && (
                <span
                  className="text-[10px] mt-0.5 truncate max-w-full px-1 text-center"
                  style={{ color: isActive ? B.accent : B.muted }}
                >
                  {s.sub}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: B.accent }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
