"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { B, DAY_LABELS, MONTH_NAMES } from "../constants";
import { getDaysInMonth, getFirstDayOfWeek } from "../utils";

interface MiniCalendarProps {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
}

export const MiniCalendar = React.memo(function MiniCalendar({
  selectedDate,
  onSelect,
}: MiniCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const weeks = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const result: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7)
      result.push(cells.slice(i, i + 7));
    return result;
  }, [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const isSel = useCallback(
    (d: number) =>
      selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === d,
    [selectedDate, viewYear, viewMonth],
  );

  const todayDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );

  const isPast = useCallback(
    (d: number) => new Date(viewYear, viewMonth, d) < todayDate,
    [viewYear, viewMonth, todayDate],
  );

  const handleSelect = useCallback(
    (day: number) => onSelect(new Date(viewYear, viewMonth, day)),
    [onSelect, viewYear, viewMonth],
  );

  return (
    <div
      className="w-full rounded"
      style={{ backgroundColor: B.card, border: `1px solid ${B.border}` }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={prevMonth}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors"
          style={{ color: B.muted }}
        >
          <ChevronLeft className="w-4 h-4" /> Prev Month
        </button>
        <span
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: B.ink }}
        >
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors"
          style={{ color: B.muted }}
        >
          Next Month <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pb-4">
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-black uppercase tracking-widest py-1"
              style={{
                color: d === "SAT" || d === "SUN" ? B.inkSoft : B.muted,
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const past = day ? isPast(day) : false;
              const sel = day ? isSel(day) : false;
              return (
                <div
                  key={di}
                  className="flex items-center justify-center py-[5px]"
                >
                  {day ? (
                    <button
                      disabled={past}
                      onClick={() => handleSelect(day)}
                      className="w-8 h-8 rounded text-xs font-bold transition-all"
                      style={{
                        backgroundColor: sel ? B.accent : "transparent",
                        color: sel
                          ? B.white
                          : past
                            ? "rgba(34,34,34,0.25)"
                            : B.ink,
                        fontWeight: sel ? 900 : 600,
                        cursor: past ? "not-allowed" : "pointer",
                      }}
                    >
                      {day}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
