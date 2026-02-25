"use client";

import { useEffect, useState } from "react";
import type { Booking } from "@/lib/db/schema";

interface BookingListProps {
  statusFilter?: string;
  showActions?: boolean;
  onAction?: () => void;
}

export default function BookingList({
  statusFilter,
  showActions = false,
  onAction,
}: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(statusFilter || "all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminMessages, setAdminMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = filter && filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/bookings${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch {
      console.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_message: adminMessages[id] || undefined,
        }),
      });
      if (res.ok) {
        fetchBookings();
        onAction?.();
      }
    } catch {
      console.error("Failed to update booking");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this booking?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBookings();
        onAction?.();
      }
    } catch {
      console.error("Failed to delete booking");
    } finally {
      setActionLoading(null);
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      approved: "bg-green-50 text-green-700 border-green-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span
        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${
          colors[status] || "bg-warm-gray-100 text-warm-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Filter (only for "all" view) */}
      {!statusFilter && (
        <div className="flex gap-2 mb-6">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filter === f
                  ? "bg-slate-blue text-white border-slate-blue"
                  : "bg-white text-warm-gray-600 border-warm-gray-200 hover:border-warm-gray-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-warm-gray-400 animate-pulse">
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-warm-gray-400">
          No {statusFilter || ""} bookings found.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-warm-gray-200 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-warm-gray-800 truncate">
                      {booking.guestName}
                    </h3>
                    {statusBadge(booking.status)}
                  </div>
                  <p className="text-sm text-warm-gray-500">{booking.guestEmail}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-warm-gray-600">
                    <span>
                      {booking.checkIn} → {booking.checkOut}
                    </span>
                    <span>{booking.numGuests} guest{booking.numGuests !== 1 ? "s" : ""}</span>
                  </div>
                  {booking.message && (
                    <p className="mt-2 text-sm text-warm-gray-500 italic">
                      &ldquo;{booking.message}&rdquo;
                    </p>
                  )}
                  {booking.adminMessage && (
                    <p className="mt-1 text-sm text-slate-blue">
                      Admin: {booking.adminMessage}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-warm-gray-400">
                    Submitted {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions for pending bookings */}
                {showActions && booking.status === "pending" && (
                  <div className="flex flex-col gap-2 sm:w-56 shrink-0">
                    <input
                      type="text"
                      placeholder="Admin message (optional)"
                      value={adminMessages[booking.id] || ""}
                      onChange={(e) =>
                        setAdminMessages((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 border border-warm-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(booking.id, "approved")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(booking.id, "rejected")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel & Remove buttons for approved bookings */}
                {booking.status === "approved" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (!confirm("Cancel this booking? A cancellation email with calendar update will be sent to the guest and hosts.")) return;
                        handleAction(booking.id, "rejected");
                      }}
                      disabled={actionLoading === booking.id}
                      className="px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === booking.id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === booking.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
