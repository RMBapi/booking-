"use client";

import React, { useEffect, useMemo } from "react";
import { X, Clock, Users, CalendarClock, Plus } from "lucide-react";
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  modalCancelButtonClass,
} from "@/components/ui";
import { Button } from "@/components/buttons";
import { cn } from "@/utils";
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
type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";
const DAY_KEYS = new Set<DayKey>([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

const timeInputClass =
  "w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors disabled:opacity-50";

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
        const rawDayKey = day.toLowerCase();
        if (!DAY_KEYS.has(rawDayKey as DayKey)) {
          return {
            day,
            isActive: true,
            startTime: "09:00",
            endTime: "17:00",
            blockedFrames: [],
          };
        }

        const dayKey = rawDayKey as DayKey;
        const dayConfig = initialConfig[dayKey];
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

  const segmentClass = (active: boolean) =>
    cn(
      "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
      active
        ? "bg-primary-600 text-white"
        : "bg-surface text-text-secondary border border-border-default hover:border-border-strong",
    );

  return (
    <ModalShell open={isOpen} onClose={onClose} size="full">
      <ModalHeader
        title="Service Availability"
        description={`Configure scheduling settings for ${serviceName}`}
        onClose={onClose}
      />

      <ModalBody>
        <form id="service-scheduling-form" onSubmit={handleSubmit}>
          <div className="space-y-8">
            {isLoading && (
              <div className="text-sm font-medium text-text-tertiary">
                Loading availability settings...
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border-subtle bg-subtle p-5">
                <div className="mb-4 flex items-center gap-2 text-text-tertiary">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Time Format
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeFormat("12")}
                    disabled={isDisabled}
                    className={segmentClass(timeFormat === "12")}
                  >
                    12-Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFormat("24")}
                    disabled={isDisabled}
                    className={segmentClass(timeFormat === "24")}
                  >
                    24-Hour
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-subtle p-5">
                <div className="mb-4 flex items-center gap-2 text-text-tertiary">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
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
                    className={cn(
                      timeInputClass,
                      "py-3 text-center text-2xl font-bold",
                    )}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Min
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-subtle p-5">
                <div className="mb-4 flex items-center gap-2 text-text-tertiary">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
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
                    className={cn(
                      timeInputClass,
                      "py-3 text-center text-2xl font-bold",
                    )}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Slots
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">
                  Weekly Availability
                </h3>
              </div>

              <div className="space-y-3">
                {schedules.map((schedule, dayIndex) => (
                  <div
                    key={schedule.day}
                    className="rounded-xl border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex items-center gap-4 lg:w-48">
                        <h4 className="min-w-[100px] text-sm font-semibold text-text-primary">
                          {schedule.day}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleDayActive(dayIndex)}
                          disabled={isDisabled}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                            schedule.isActive
                              ? "bg-primary-600 text-white"
                              : "bg-subtle text-text-tertiary",
                          )}
                        >
                          {schedule.isActive ? "Active" : "Day Off"}
                        </button>
                      </div>

                      {schedule.isActive ? (
                        <>
                          <div className="flex items-center gap-4 lg:flex-1">
                            <div className="flex-1">
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
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
                                className={timeInputClass}
                              />
                            </div>

                            <div className="flex-1">
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
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
                                className={timeInputClass}
                              />
                            </div>
                          </div>

                          <div className="lg:w-80">
                            <div className="mb-2 flex items-center justify-between">
                              <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                                Blocked Time Frames
                              </label>
                              <button
                                type="button"
                                onClick={() => addBlockedFrame(dayIndex)}
                                disabled={isDisabled}
                                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary-600 transition-colors hover:text-primary-700"
                              >
                                <Plus className="h-3 w-3" />
                                Add Frame
                              </button>
                            </div>

                            <div className="max-h-32 space-y-2 overflow-y-auto custom-scrollbar">
                              {schedule.blockedFrames.length === 0 ? (
                                <div className="py-2 text-xs italic text-text-tertiary">
                                  No blocked time frames
                                </div>
                              ) : (
                                schedule.blockedFrames.map((frame) => (
                                  <div
                                    key={frame.id}
                                    className="group flex items-center gap-2 rounded-lg border border-border-subtle bg-subtle p-2.5"
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
                                      className={cn(
                                        timeInputClass,
                                        "px-2 py-1 text-xs",
                                      )}
                                    />
                                    <span className="text-text-tertiary">—</span>
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
                                      className={cn(
                                        timeInputClass,
                                        "px-2 py-1 text-xs",
                                      )}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeBlockedFrame(dayIndex, frame.id)
                                      }
                                      disabled={isDisabled}
                                      className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-rose-50 hover:text-rose-500"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 text-sm italic text-text-tertiary">
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
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={modalCancelButtonClass}
        >
          Cancel
        </button>
        <Button
          type="submit"
          form="service-scheduling-form"
          size="sm"
          isLoading={isSubmitting}
          disabled={isDisabled}
        >
          Save Availability Settings
        </Button>
      </ModalFooter>
    </ModalShell>
  );
};
