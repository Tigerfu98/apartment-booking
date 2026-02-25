"use client";

import { useEffect, useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, differenceInCalendarDays, isBefore, startOfDay, parseISO } from "date-fns";

interface AvailabilityCalendarProps {
  onRangeSelect: (range: { checkIn: string; checkOut: string } | null) => void;
}

export default function AvailabilityCalendar({ onRangeSelect }: AvailabilityCalendarProps) {
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [selected, setSelected] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch("/api/availability");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const dates = (data.unavailableDates as string[]).map((d) => parseISO(d));
        setUnavailableDates(dates);
      } catch {
        setError("Could not load availability. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, []);

  const today = startOfDay(new Date());

  function handleSelect(range: DateRange | undefined) {
    setSelected(range);

    if (range?.from && range?.to) {
      const nights = differenceInCalendarDays(range.to, range.from);
      if (nights >= 1 && nights <= 5) {
        const checkIn = range.from.toISOString().split("T")[0];
        const checkOut = range.to.toISOString().split("T")[0];
        onRangeSelect({ checkIn, checkOut });
      } else {
        onRangeSelect(null);
      }
    } else {
      onRangeSelect(null);
    }
  }

  // Check if a date in the range conflicts with unavailable dates
  function isRangeConflicting(from: Date, to: Date): boolean {
    const days = differenceInCalendarDays(to, from);
    for (let i = 0; i <= days; i++) {
      const d = addDays(from, i);
      if (unavailableDates.some((ud) => ud.getTime() === d.getTime())) {
        return true;
      }
    }
    return false;
  }

  // Disable dates that are unavailable or in the past
  function isDisabled(date: Date): boolean {
    if (isBefore(date, today)) return true;
    if (unavailableDates.some((d) => d.getTime() === date.getTime())) return true;
    return false;
  }

  const nights = selected?.from && selected?.to
    ? differenceInCalendarDays(selected.to, selected.from)
    : 0;

  const rangeError =
    selected?.from && selected?.to
      ? nights > 5
        ? "Maximum stay is 5 nights"
        : nights < 1
          ? "Minimum stay is 1 night"
          : isRangeConflicting(selected.from, selected.to)
            ? "Selected dates include unavailable dates"
            : null
      : null;

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-warm-gray-400">Loading availability...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <>
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={isDisabled}
            fromDate={today}
            toDate={addDays(today, 180)}
            className="mx-auto"
            classNames={{
              root: "rdp-root mx-auto",
              months: "flex flex-col sm:flex-row gap-4",
              month_caption: "text-warm-gray-700 font-medium text-sm mb-2",
              weekday: "text-warm-gray-400 text-xs font-normal w-10 h-8",
              day: "w-10 h-10 text-sm rounded-lg",
              day_button: "w-10 h-10 rounded-lg hover:bg-warm-gray-100 transition-colors",
              selected: "bg-slate-blue text-white hover:bg-slate-blue-dark",
              range_start: "bg-slate-blue text-white rounded-l-lg",
              range_end: "bg-slate-blue text-white rounded-r-lg",
              range_middle: "bg-slate-blue/10 text-warm-gray-800",
              disabled: "text-warm-gray-300 line-through cursor-not-allowed hover:bg-transparent",
              today: "font-bold text-slate-blue",
            }}
          />

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-xs text-warm-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-slate-blue" />
              Selected
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded bg-warm-gray-200 line-through text-[8px] flex items-center justify-center" />
              Unavailable
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded border border-slate-blue" />
              Today
            </div>
          </div>

          {/* Selection info */}
          {selected?.from && (
            <div className="mt-4 text-center text-sm text-warm-gray-600">
              {selected.to ? (
                rangeError ? (
                  <span className="text-red-500">{rangeError}</span>
                ) : (
                  <span>
                    {nights} night{nights !== 1 ? "s" : ""} selected
                  </span>
                )
              ) : (
                <span>Select a check-out date (1–5 nights)</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
