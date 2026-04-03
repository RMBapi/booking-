"use client";

import React, { useEffect, useMemo } from "react";
import { X, Clock, Users, CalendarClock, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { CanScheduleTime } from "@/services";

interface BlockedTimeFrame {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
  blockedFrames: BlockedTimeFrame[];
}

interface ServiceSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: CanScheduleTime | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: {
    timeFormat: "12" | "24";
    interval: number;
    capacity: number;
    schedules: DaySchedule[];
  }) => void;
  serviceName?: string;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const ServiceSchedulingModal = ({
  isOpen,
  onClose,
  initialConfig,
  isLoading = false,
  isSubmitting = false,
  onSubmit,
  serviceName = "Service",
}: ServiceSchedulingModalProps) => {
  const [timeFormat, setTimeFormat] = React.useState<"12" | "24">("12");
  const [interval, setInterval] = React.useState("30");
  const [capacity, setCapacity] = React.useState("1");

  const defaultSchedules = useMemo<DaySchedule[]>(
    () =>
      DAYS_OF_WEEK.map((day) => ({
        day,
        isActive: day !== "Sunday" && day !== "Saturday",
        startTime: "09:00",
        endTime: "17:00",
        blockedFrames: [],
      })),
    [],
  );

  const [schedules, setSchedules] =
    React.useState<DaySchedule[]>(defaultSchedules);

  useEffect(() => {
    if (!isOpen) return;

    if (!initialConfig) {
      setTimeFormat("12");
      setInterval("30");
      setCapacity("1");
      setSchedules(defaultSchedules);
      return;
    }

    setTimeFormat(initialConfig.timeFormat ?? "12");
    setInterval(String(initialConfig.timeSlotConfig?.intervalMinutes ?? 30));
    setCapacity(String(initialConfig.timeSlotConfig?.bookingsPerSlot ?? 1));

    const blockedTimes = initialConfig.blockedTimes ?? {};

    setSchedules(
      DAYS_OF_WEEK.map((day) => {
        const dayKey = day.toLowerCase();
        const dayConfig =
          initialConfig[dayKey as keyof CanScheduleTime] ?? undefined;
        const isOff = dayConfig?.isOff ?? false;
        const frames = blockedTimes[dayKey] ?? [];

        return {
          day,
          isActive: !isOff,
          startTime: dayConfig?.startTime ?? "09:00",
          endTime: dayConfig?.endTime ?? "17:00",
          blockedFrames: frames.map((frame, index) => ({
            id: `${dayKey}-${index}-${frame.startTime}-${frame.endTime}`,
            startTime: frame.startTime,
            endTime: frame.endTime,
          })),
        };
      }),
    );
  }, [defaultSchedules, initialConfig, isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      timeFormat,
      interval: parseInt(interval, 10),
      capacity: parseInt(capacity, 10),
      schedules,
    });
  };

  const isDisabled = isLoading || isSubmitting;

  const toggleDayActive = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((schedule, idx) =>
        idx === dayIndex
          ? { ...schedule, isActive: !schedule.isActive }
          : schedule,
      ),
    );
  };

  const updateDayTime = (
    dayIndex: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setSchedules((prev) =>
      prev.map((schedule, idx) =>
        idx === dayIndex ? { ...schedule, [field]: value } : schedule,
      ),
    );
  };

  const addBlockedFrame = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((schedule, idx) => {
        if (idx !== dayIndex) return schedule;
        return {
          ...schedule,
          blockedFrames: [
            ...schedule.blockedFrames,
            {
              id: Date.now().toString(),
              startTime: "12:00",
              endTime: "13:00",
            },
          ],
        };
      }),
    );
  };

  const removeBlockedFrame = (dayIndex: number, frameId: string) => {
    setSchedules((prev) =>
      prev.map((schedule, idx) => {
        if (idx !== dayIndex) return schedule;
        return {
          ...schedule,
          blockedFrames: schedule.blockedFrames.filter(
            (frame) => frame.id !== frameId,
          ),
        };
      }),
    );
  };

  const updateBlockedFrame = (
    dayIndex: number,
    frameId: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setSchedules((prev) =>
      prev.map((schedule, idx) => {
        if (idx !== dayIndex) return schedule;
        return {
          ...schedule,
          blockedFrames: schedule.blockedFrames.map((frame) =>
            frame.id === frameId ? { ...frame, [field]: value } : frame,
          ),
        };
      }),
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-8 py-6 border-b border-stone-200/50 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">
                    Service Availability
                  </h2>
                  <p className="text-sm text-stone-500 font-medium mt-0.5">
                    Configure scheduling settings for {serviceName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-200/50 rounded-xl text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-8 py-6"
            >
              <div className="space-y-8">
                {isLoading && (
                  <div className="text-sm text-stone-500 font-medium">
                    Loading availability settings...
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2 text-stone-500 mb-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Time Format
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTimeFormat("12")}
                        disabled={isDisabled}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                          timeFormat === "12"
                            ? "bg-stone-900 text-white shadow-lg"
                            : "bg-white text-stone-400 border border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        12-Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFormat("24")}
                        disabled={isDisabled}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                          timeFormat === "24"
                            ? "bg-stone-900 text-white shadow-lg"
                            : "bg-white text-stone-400 border border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        24-Hour
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2 text-stone-500 mb-4">
                      <CalendarClock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Interval
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="5"
                        max="480"
                        step="5"
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                        disabled={isDisabled}
                        className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 font-bold text-2xl text-center focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                      />
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                        Min
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2 text-stone-500 mb-4">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Capacity
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        disabled={isDisabled}
                        className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-900 font-bold text-2xl text-center focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                      />
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                        Slots
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-stone-900">
                      Weekly Availability
                    </h3>
                    <button
                      type="button"
                      className="text-xs font-bold text-stone-400 uppercase tracking-wider hover:text-stone-600 transition-colors"
                    >
                      Configure Operating Hours
                    </button>
                  </div>

                  <div className="space-y-3">
                    {schedules.map((schedule, dayIndex) => (
                      <div
                        key={schedule.day}
                        className="p-6 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex items-center gap-4 lg:w-48">
                            <h4 className="text-lg font-bold text-stone-900 min-w-[100px]">
                              {schedule.day}
                            </h4>
                            <button
                              type="button"
                              onClick={() => toggleDayActive(dayIndex)}
                              disabled={isDisabled}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                schedule.isActive
                                  ? "bg-[#8BA88E] text-white"
                                  : "bg-stone-100 text-stone-400"
                              }`}
                            >
                              {schedule.isActive ? "Active" : "Day Off"}
                            </button>
                          </div>

                          {schedule.isActive ? (
                            <>
                              <div className="flex items-center gap-4 lg:flex-1">
                                <div className="flex-1">
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={schedule.startTime}
                                    onChange={(e) =>
                                      updateDayTime(
                                        dayIndex,
                                        "startTime",
                                        e.target.value,
                                      )
                                    }
                                    disabled={isDisabled}
                                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                                  />
                                </div>

                                <div className="flex-1">
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">
                                    End Time
                                  </label>
                                  <input
                                    type="time"
                                    value={schedule.endTime}
                                    onChange={(e) =>
                                      updateDayTime(
                                        dayIndex,
                                        "endTime",
                                        e.target.value,
                                      )
                                    }
                                    disabled={isDisabled}
                                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                                  />
                                </div>
                              </div>

                              <div className="lg:w-80">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                                    Blocked Time Frames
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addBlockedFrame(dayIndex)}
                                    disabled={isDisabled}
                                    className="text-xs font-bold text-[#D4A574] uppercase tracking-wider hover:text-[#C4956A] transition-colors flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Frame
                                  </button>
                                </div>

                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {schedule.blockedFrames.length === 0 ? (
                                    <div className="text-xs text-stone-400 italic py-2">
                                      No blocked time frames
                                    </div>
                                  ) : (
                                    schedule.blockedFrames.map((frame) => (
                                      <div
                                        key={frame.id}
                                        className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 group"
                                      >
                                        <input
                                          type="time"
                                          value={frame.startTime}
                                          onChange={(e) =>
                                            updateBlockedFrame(
                                              dayIndex,
                                              frame.id,
                                              "startTime",
                                              e.target.value,
                                            )
                                          }
                                          disabled={isDisabled}
                                          className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4A574]/20"
                                        />
                                        <span className="text-stone-400">
                                          —
                                        </span>
                                        <input
                                          type="time"
                                          value={frame.endTime}
                                          onChange={(e) =>
                                            updateBlockedFrame(
                                              dayIndex,
                                              frame.id,
                                              "endTime",
                                              e.target.value,
                                            )
                                          }
                                          disabled={isDisabled}
                                          className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4A574]/20"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeBlockedFrame(
                                              dayIndex,
                                              frame.id,
                                            )
                                          }
                                          disabled={isDisabled}
                                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 text-sm text-stone-400 italic">
                              This day is marked as unavailable
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="px-8 py-6 border-t border-stone-200/50 bg-stone-50/50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="flex-1 px-6 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.97]"
              >
                {isSubmitting ? "Saving..." : "Save Availability Settings"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
