"use client";

import React from "react";
import { B } from "../constants";
import type { Step, StepMeta } from "../types";

interface StepBarProps {
  steps: StepMeta[];
  activeStep: Step;
  completedSteps: Step[];
  onStepClick?: (step: Step | "services") => void;
}

export const StepBar = React.memo(function StepBar({
  steps,
  activeStep,
  completedSteps,
  onStepClick,
}: StepBarProps) {
  return (
    <div
      className="w-full border-b"
      style={{ backgroundColor: B.card, borderColor: B.border }}
    >
      <div className="max-w-5xl mx-auto flex items-stretch">
        <div
          className="flex-1 relative flex flex-col items-center justify-center py-4 px-2 cursor-pointer"
          style={{ borderRight: `1px solid ${B.border}` }}
          onClick={() => onStepClick?.("services")}
        >
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: B.ink }}
          >
            SERVICES
          </span>
          <span
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: B.ink }}
          />
        </div>

        {steps.map((s, i) => {
          const isActive = s.key === activeStep;
          const isDone = completedSteps.includes(s.key);
          return (
            <div
              key={s.key}
              className={`flex-1 relative flex flex-col items-center justify-center py-4 px-2 ${
                isActive || isDone ? "cursor-pointer" : "cursor-default"
              }`}
              style={{
                borderRight:
                  i < steps.length - 1 ? `1px solid ${B.border}` : undefined,
              }}
              onClick={() => {
                if (isActive || isDone) onStepClick?.(s.key);
              }}
            >
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{
                  color: isActive ? B.ink : isDone ? B.inkSoft : B.muted,
                }}
              >
                {s.label}
              </span>
              {s.sub && (
                <span
                  className="text-[10px] mt-0.5 truncate max-w-full px-1 text-center"
                  style={{ color: isActive ? B.ink : B.muted }}
                >
                  {s.sub}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px]"
                  style={{ backgroundColor: B.ink }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
