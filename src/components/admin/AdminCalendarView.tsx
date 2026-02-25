"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { parseISO, addDays } from "date-fns";
import type { Booking } from "@/lib/db/schema";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function AdminCalendarView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings?status=approved");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings);
        } else {
          setError("Failed to load bookings");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  // Build booked date ranges for display
  const bookedRanges = bookings.map((b) => ({
    from: parseISO(b.checkIn),
    to: addDays(parseISO(b.checkOut), -1), // checkOut is the departure day
  }));

  const today = new Date();

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-gray-400 animate-pulse">
        Loading calendar...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">{error}</div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-warm-gray-200 p-4 sm:p-6">
        <DayPicker
          mode="multiple"
          numberOfMonths={isMobile ? 1 : 3}
          fromDate={today}
          toDate={addDays(today, 180)}
          className="mx-auto"
          modifiers={{
            booked: bookedRanges.flatMap((range) => {
              const dates: Date[] = [];
              const current = new Date(range.from);
              while (current <= range.to) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
              }
              return dates;
            }),
          }}
          modifiersClassNames={{
            booked: "!bg-slate-blue/20 !text-slate-blue !font-medium",
          }}
          classNames={{
            root: "rdp-root mx-auto",
            months: "flex flex-col md:flex-row gap-4",
            month_caption: "text-warm-gray-700 font-medium text-sm mb-2",
            weekday: "text-warm-gray-400 text-xs font-normal w-10 h-8",
            day: "w-10 h-10 text-sm rounded-lg",
            day_button: "w-10 h-10 rounded-lg",
            today: "font-bold text-slate-blue",
          }}
          disabled
        />

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-6 text-xs text-warm-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-slate-blue/20" />
            Approved Booking
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded border border-slate-blue" />
            Today
          </div>
        </div>
      </div>

      {/* Upcoming bookings list */}
      {bookings.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-warm-gray-700 mb-3">
            Upcoming Approved Bookings
          </h3>
          <div className="space-y-2">
            {bookings
              .filter((b) => b.checkIn >= today.toISOString().split("T")[0])
              .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
              .map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg border border-warm-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <span className="font-medium text-sm text-warm-gray-800">
                      {booking.guestName}
                    </span>
                    <span className="text-warm-gray-400 mx-2">·</span>
                    <span className="text-sm text-warm-gray-500">
                      {booking.numGuests} guest{booking.numGuests !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-sm text-warm-gray-600">
                    {booking.checkIn} → {booking.checkOut}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
