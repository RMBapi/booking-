"use client";

import React, { useState } from "react";
import { CanScheduleTime, DaySchedule } from "@/types";
import { cn } from "@/utils";
import { Clock3, Timer, Users2 } from "lucide-react";

interface SchedulerFormProps {
  serviceId: string;
  existingScheduler?: { canScheduleTime: CanScheduleTime };
  isSubmitting: boolean;
  onSubmit: (data: { serviceId: string; canScheduleTime: CanScheduleTime }) => void;
  formId?: string;
}

const days = [
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
] as const;

export const SchedulerForm: React.FC<SchedulerFormProps> = ({
  serviceId,
  existingScheduler,
  isSubmitting,
  onSubmit,
  formId,
}) => {
  const [formData, setFormData] = useState<CanScheduleTime>({
    timeFormat: existingScheduler?.canScheduleTime?.timeFormat || "12",
    timeSlotConfig: {
      intervalMinutes: existingScheduler?.canScheduleTime?.timeSlotConfig?.intervalMinutes || 30,
      allowUserSelection: existingScheduler?.canScheduleTime?.timeSlotConfig?.allowUserSelection ?? true,
      bookingsPerSlot: existingScheduler?.canScheduleTime?.timeSlotConfig?.bookingsPerSlot || 1,
    },
    blockedTimes: existingScheduler?.canScheduleTime?.blockedTimes || {},
    ...(existingScheduler?.canScheduleTime || {}),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatTime = (time: string, fmt: "12" | "24") => {
    if (!time) return "";
    if (fmt === "24") return time;
    const [hStr, mStr] = time.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12.toString().padStart(2, "0")}:${mStr} ${suffix}`;
  };

  const handleDayChange = <K extends keyof DaySchedule>(
    day: string,
    field: K,
    value: DaySchedule[K]
  ) => {
    setFormData((prev) => {
      const dayData = prev[day as keyof CanScheduleTime] as DaySchedule | undefined;
      return {
        ...prev,
        [day]: {
          ...dayData,
          [field]: value,
          // If isOff is true, clear startTime and endTime
          ...(field === "isOff" && value === true
            ? { startTime: undefined, endTime: undefined }
            : {}),
        },
      };
    });
    // Clear errors for this day
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${day}.startTime`];
      delete newErrors[`${day}.endTime`];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only validate day schedules if allowUserSelection is enabled
    if (formData.timeSlotConfig.allowUserSelection) {
      // Validate each day
      days.forEach(({ key }) => {
        const dayData = formData[key] as DaySchedule | undefined;
        if (dayData && !dayData.isOff) {
          if (!dayData.startTime || !dayData.endTime) {
            newErrors[`${key}.startTime`] = "Start time and end time are required when day is not off";
          } else {
            // Validate that start time is before end time
            const [startHour, startMin] = dayData.startTime.split(":").map(Number);
            const [endHour, endMin] = dayData.endTime.split(":").map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (startMinutes >= endMinutes) {
              newErrors[`${key}.endTime`] = "End time must be after start time";
            }

            // Validate blocked times for this day
            const blockedTimes = formData.blockedTimes?.[key] || [];
            blockedTimes.forEach((blocked, index) => {
              const [blockStartHour, blockStartMin] = blocked.startTime.split(":").map(Number);
              const [blockEndHour, blockEndMin] = blocked.endTime.split(":").map(Number);
              const blockStartMinutes = blockStartHour * 60 + blockStartMin;
              const blockEndMinutes = blockEndHour * 60 + blockEndMin;

              // Check if blocked time is within day schedule
              if (blockStartMinutes < startMinutes || blockEndMinutes > endMinutes) {
                newErrors[`${key}.blockedTimes.${index}`] = "Blocked time must be within day schedule";
              }

              // Check if blocked start time is before end time
              if (blockStartMinutes >= blockEndMinutes) {
                newErrors[`${key}.blockedTimes.${index}`] = "Blocked end time must be after start time";
              }
            });
          }
        }
      });
    }

    // Validate time slot config
    if (formData.timeSlotConfig.allowUserSelection) {
      if (formData.timeSlotConfig.intervalMinutes < 15 || formData.timeSlotConfig.intervalMinutes > 120) {
        newErrors["intervalMinutes"] = "Interval must be between 15 and 120 minutes";
      }

      if (formData.timeSlotConfig.bookingsPerSlot < 1) {
        newErrors["bookingsPerSlot"] = "Bookings per slot must be at least 1";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      serviceId,
      canScheduleTime: formData,
    });
  };

  const addBlockedTime = (day: string) => {
    setFormData((prev) => {
      const blockedTimes = prev.blockedTimes || {};
      const dayBlockedTimes = blockedTimes[day] || [];
      return {
        ...prev,
        blockedTimes: {
          ...blockedTimes,
          [day]: [
            ...dayBlockedTimes,
            { startTime: "09:00", endTime: "10:00" },
          ],
        },
      };
    });
  };

  const removeBlockedTime = (day: string, index: number) => {
    setFormData((prev) => {
      const blockedTimes = prev.blockedTimes || {};
      const dayBlockedTimes = blockedTimes[day] || [];
      return {
        ...prev,
        blockedTimes: {
          ...blockedTimes,
          [day]: dayBlockedTimes.filter((_, i) => i !== index),
        },
      };
    });
  };

  const updateBlockedTime = (day: string, index: number, field: "startTime" | "endTime", value: string) => {
    setFormData((prev) => {
      const blockedTimes = prev.blockedTimes || {};
      const dayBlockedTimes = blockedTimes[day] || [];
      return {
        ...prev,
        blockedTimes: {
          ...blockedTimes,
          [day]: dayBlockedTimes.map((bt, i) =>
            i === index ? { ...bt, [field]: value } : bt
          ),
        },
      };
    });
    // Clear errors for this blocked time
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${day}.blockedTimes.${index}`];
      return newErrors;
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-8">

      {/* ── Top Config Row ── */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Time Format */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            <Clock3 className="h-3.5 w-3.5" />
            Time Format
          </div>
          <div className="mt-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            {(["12", "24"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, timeFormat: fmt }))}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition",
                  formData.timeFormat === fmt
                    ? "bg-white text-primary-700 shadow-sm ring-1 ring-primary-100"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {fmt === "12" ? "12-Hour" : "24-Hour"}
              </button>
            ))}
          </div>
        </div>

        {/* Interval */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            <Timer className="h-3.5 w-3.5" />
            Interval
          </div>
          <div className="relative mt-4">
            <input
              type="number"
              min="15"
              max="120"
              step="15"
              value={formData.timeSlotConfig.intervalMinutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  timeSlotConfig: { ...prev.timeSlotConfig, intervalMinutes: parseInt(e.target.value) || 30 },
                }))
              }
              disabled={!formData.timeSlotConfig.allowUserSelection || isSubmitting}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-14 text-base font-semibold text-gray-900 outline-none transition focus:border-primary-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              min
            </span>
          </div>
          {errors.intervalMinutes && (
            <p className="mt-1.5 text-xs text-red-500">{errors.intervalMinutes}</p>
          )}
        </div>

        {/* Capacity */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            <Users2 className="h-3.5 w-3.5" />
            Capacity
          </div>
          <div className="relative mt-4">
            <input
              type="number"
              min="1"
              value={formData.timeSlotConfig.bookingsPerSlot}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  timeSlotConfig: { ...prev.timeSlotConfig, bookingsPerSlot: parseInt(e.target.value) || 1 },
                }))
              }
              disabled={!formData.timeSlotConfig.allowUserSelection || isSubmitting}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-16 text-base font-semibold text-gray-900 outline-none transition focus:border-primary-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              slots
            </span>
          </div>
          {errors.bookingsPerSlot && (
            <p className="mt-1.5 text-xs text-red-500">{errors.bookingsPerSlot}</p>
          )}
        </div>

      </div>

      {/* ── Weekly Availability ── */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Availability</h3>
          <label className="inline-flex cursor-pointer select-none items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm transition hover:border-gray-300">
            <span className={cn("h-2 w-2 rounded-full", formData.timeSlotConfig.allowUserSelection ? "bg-emerald-500" : "bg-gray-300")} />
            <span className="text-xs font-semibold text-gray-600">
              {formData.timeSlotConfig.allowUserSelection ? "Enabled" : "Disabled"}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={formData.timeSlotConfig.allowUserSelection}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  timeSlotConfig: { ...prev.timeSlotConfig, allowUserSelection: e.target.checked },
                }))
              }
              disabled={isSubmitting}
            />
          </label>
        </div>

        {!formData.timeSlotConfig.allowUserSelection ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <span className="font-semibold">Manual scheduling mode — </span>
            customers won&apos;t pick time slots; you schedule appointments yourself.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {days.map(({ key, label }) => {
              const dayData = formData[key] as DaySchedule | undefined;
              const isOff = dayData?.isOff ?? false;
              const blockedTimes = formData.blockedTimes?.[key] || [];

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-wrap items-start gap-x-6 gap-y-3 rounded-2xl border bg-white px-5 py-4 transition",
                    isOff ? "border-gray-100" : "border-gray-200 shadow-sm"
                  )}
                >
                  {/* ── Day name + toggle ── */}
                  <div className="flex w-36 shrink-0 items-center gap-3">
                    <span className={cn("text-base font-semibold", isOff ? "text-gray-400" : "text-gray-900")}>
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDayChange(key, "isOff", !isOff)}
                      disabled={isSubmitting}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition",
                        isOff
                          ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                      )}
                    >
                      {isOff ? "Off" : "On"}
                    </button>
                  </div>

                  {/* ── Time range or unavailable label ── */}
                  {isOff ? (
                    <span className="self-center text-xs font-medium text-gray-400">Unavailable for bookings</span>
                  ) : (
                    <>
                      {/* Time inputs inline */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">From</span>
                          <div className={cn("flex h-9 items-center rounded-xl border bg-gray-50 px-3", errors[`${key}.startTime`] ? "border-red-300" : "border-gray-200")}>
                            <input
                              type="time"
                              value={dayData?.startTime || ""}
                              onChange={(e) => handleDayChange(key, "startTime", e.target.value)}
                              disabled={isSubmitting}
                              required
                              aria-label={`${label} start time`}
                              className="bg-transparent text-sm font-semibold text-gray-800 outline-none"
                            />
                          </div>
                        </div>
                        <span className="mt-4 text-gray-300">→</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">To</span>
                          <div className={cn("flex h-9 items-center rounded-xl border bg-gray-50 px-3", errors[`${key}.endTime`] ? "border-red-300" : "border-gray-200")}>
                            <input
                              type="time"
                              value={dayData?.endTime || ""}
                              onChange={(e) => handleDayChange(key, "endTime", e.target.value)}
                              disabled={isSubmitting}
                              required
                              aria-label={`${label} end time`}
                              className="bg-transparent text-sm font-semibold text-gray-800 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      {(errors[`${key}.startTime`] || errors[`${key}.endTime`]) && (
                        <p className="w-full text-xs text-red-500">
                          {errors[`${key}.startTime`] || errors[`${key}.endTime`]}
                        </p>
                      )}

                      {/* Blocked frames */}
                      <div className="ml-auto flex min-w-0 flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                            Blocked {blockedTimes.length > 0 && `(${blockedTimes.length})`}
                          </span>
                          <button
                            type="button"
                            onClick={() => addBlockedTime(key)}
                            disabled={isSubmitting}
                            className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600 ring-1 ring-orange-200 hover:bg-orange-100"
                          >
                            + Add
                          </button>
                        </div>
                        {blockedTimes.length === 0 ? (
                          <span className="text-[11px] italic text-gray-400">None</span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {blockedTimes.map((blocked, index) => (
                              <div key={index}>
                                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                                  <input
                                    type="time"
                                    value={blocked.startTime}
                                    onChange={(e) => updateBlockedTime(key, index, "startTime", e.target.value)}
                                    disabled={isSubmitting}
                                    aria-label={`${label} blocked start ${index + 1}`}
                                    title={formatTime(blocked.startTime, formData.timeFormat)}
                                    className="w-24 bg-transparent text-xs font-semibold text-gray-700 outline-none"
                                  />
                                  <span className="text-gray-300">—</span>
                                  <input
                                    type="time"
                                    value={blocked.endTime}
                                    onChange={(e) => updateBlockedTime(key, index, "endTime", e.target.value)}
                                    disabled={isSubmitting}
                                    aria-label={`${label} blocked end ${index + 1}`}
                                    title={formatTime(blocked.endTime, formData.timeFormat)}
                                    className="w-24 bg-transparent text-xs font-semibold text-gray-700 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeBlockedTime(key, index)}
                                    disabled={isSubmitting}
                                    title="Remove"
                                    className="ml-1 text-gray-400 transition hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </div>
                                {errors[`${key}.blockedTimes.${index}`] && (
                                  <p className="mt-0.5 text-[10px] text-red-500">
                                    {errors[`${key}.blockedTimes.${index}`]}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </form>
  );
};
