"use client";

import { useEffect, useState, FormEvent } from "react";
import type { BlackoutDate } from "@/lib/db/schema";

interface BlackoutManagerProps {
  onChanged: () => void;
}

export default function BlackoutManager({ onChanged }: BlackoutManagerProps) {
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlackouts();
  }, []);

  async function fetchBlackouts() {
    setLoading(true);
    try {
      const res = await fetch("/api/blackout-dates");
      if (res.ok) {
        const data = await res.json();
        setBlackouts(data.blackoutDates);
      }
    } catch {
      console.error("Failed to fetch blackout dates");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Both dates are required");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after start date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/blackout-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          reason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add blackout dates");
        return;
      }

      setStartDate("");
      setEndDate("");
      setReason("");
      fetchBlackouts();
      onChanged();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/blackout-dates?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchBlackouts();
        onChanged();
      }
    } catch {
      console.error("Failed to delete blackout date");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-warm-gray-200 p-6">
        <h3 className="text-sm font-medium text-warm-gray-700 mb-4">
          Add Blackout Dates
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label
              htmlFor="start-date"
              className="block text-xs font-medium text-warm-gray-600 mb-1"
            >
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-warm-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block text-xs font-medium text-warm-gray-600 mb-1"
            >
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-warm-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
            />
          </div>
          <div>
            <label
              htmlFor="reason"
              className="block text-xs font-medium text-warm-gray-600 mb-1"
            >
              Reason <span className="text-warm-gray-400">(optional)</span>
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Personal use, Maintenance"
              className="w-full px-3 py-2 border border-warm-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-slate-blue text-white text-sm font-medium rounded-lg hover:bg-slate-blue-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Blackout Dates"}
          </button>
        </form>
      </div>

      {/* Existing blackouts list */}
      <div>
        <h3 className="text-sm font-medium text-warm-gray-700 mb-4">
          Current Blackout Dates
        </h3>
        {loading ? (
          <div className="text-center py-8 text-warm-gray-400 animate-pulse">
            Loading...
          </div>
        ) : blackouts.length === 0 ? (
          <div className="text-center py-8 text-warm-gray-400">
            No blackout dates set.
          </div>
        ) : (
          <div className="space-y-2">
            {blackouts.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-lg border border-warm-gray-200 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-warm-gray-800">
                    {b.startDate} → {b.endDate}
                  </p>
                  {b.reason && (
                    <p className="text-xs text-warm-gray-500">{b.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deletingId === b.id}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingId === b.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
