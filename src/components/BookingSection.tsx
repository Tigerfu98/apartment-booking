"use client";

import { useState } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BookingForm from "./BookingForm";

export default function BookingSection() {
  const [dateRange, setDateRange] = useState<{
    checkIn: string;
    checkOut: string;
  } | null>(null);

  return (
    <section id="calendar" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-light text-center text-warm-gray-800 mb-2">
          Check Availability
        </h2>
        <p className="text-center text-warm-gray-500 mb-10 font-light">
          Select your dates to request a stay (1–5 nights)
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-warm-gray-200 p-6 md:p-10">
          <AvailabilityCalendar onRangeSelect={setDateRange} />

          <div className="mt-10 pt-8 border-t border-warm-gray-200">
            <h3 className="text-xl font-medium text-warm-gray-800 text-center mb-6">
              Request Your Stay
            </h3>
            <BookingForm dateRange={dateRange} />
          </div>
        </div>
      </div>
    </section>
  );
}
