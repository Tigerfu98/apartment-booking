"use client";

import { useState, FormEvent } from "react";
import { bookingRequestSchema } from "@/lib/validations/booking";

interface BookingFormProps {
  dateRange: { checkIn: string; checkOut: string } | null;
}

interface FieldErrors {
  guest_name?: string[];
  guest_email?: string[];
  num_guests?: string[];
  check_in?: string[];
  check_out?: string[];
  message?: string[];
}

export default function BookingForm({ dateRange }: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [numGuests, setNumGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    if (!dateRange) return;

    const formData = {
      guest_name: name,
      guest_email: email,
      num_guests: numGuests,
      check_in: dateRange.checkIn,
      check_out: dateRange.checkOut,
      message: message || undefined,
    };

    // Client-side validation
    const result = bookingRequestSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors as FieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-warm-gray-800 mb-2">Request Submitted!</h3>
        <p className="text-warm-gray-500">
          You&apos;ll hear back within 24 hours. A confirmation has been sent to{" "}
          <span className="font-medium">{email}</span>.
        </p>
      </div>
    );
  }

  if (!dateRange) {
    return (
      <div className="text-center py-8 text-warm-gray-400">
        Select your check-in and check-out dates above to continue.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <div className="bg-warm-gray-100 rounded-lg px-4 py-3 text-sm text-warm-gray-600 text-center">
        <span className="font-medium">{dateRange.checkIn}</span>
        {" → "}
        <span className="font-medium">{dateRange.checkOut}</span>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-warm-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue transition-colors"
          placeholder="Your name"
        />
        {errors.guest_name && (
          <p className="mt-1 text-xs text-red-500">{errors.guest_name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-warm-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue transition-colors"
          placeholder="you@example.com"
        />
        {errors.guest_email && (
          <p className="mt-1 text-xs text-red-500">{errors.guest_email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="guests" className="block text-sm font-medium text-warm-gray-700 mb-1">
          Number of Guests
        </label>
        <input
          id="guests"
          type="number"
          min={1}
          max={10}
          value={numGuests}
          onChange={(e) => setNumGuests(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue transition-colors"
        />
        {errors.num_guests && (
          <p className="mt-1 text-xs text-red-500">{errors.num_guests[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-warm-gray-700 mb-1">
          Message <span className="text-warm-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue transition-colors resize-none"
          placeholder="Anything we should know about your stay?"
        />
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-slate-blue text-white text-sm font-semibold rounded-lg shadow-lg hover:bg-slate-blue-dark hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {submitting ? "Submitting..." : "Request to Book"}
      </button>
    </form>
  );
}
