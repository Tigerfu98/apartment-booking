"use client";

import { useState } from "react";
import BookingList from "./BookingList";
import AdminCalendarView from "./AdminCalendarView";
import BlackoutManager from "./BlackoutManager";

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = "pending" | "all" | "calendar" | "blackouts";

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    onLogout();
  }

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "all", label: "All Bookings" },
    { key: "calendar", label: "Calendar" },
    { key: "blackouts", label: "Blackout Dates" },
  ];

  return (
    <div className="min-h-screen bg-warm-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-medium text-warm-gray-800">
            Casa STFU Admin
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-warm-gray-500 hover:text-warm-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-warm-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-slate-blue text-slate-blue"
                    : "border-transparent text-warm-gray-500 hover:text-warm-gray-700 hover:border-warm-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "pending" && (
          <BookingList
            key={`pending-${refreshKey}`}
            statusFilter="pending"
            showActions
            onAction={triggerRefresh}
          />
        )}
        {activeTab === "all" && (
          <BookingList key={`all-${refreshKey}`} />
        )}
        {activeTab === "calendar" && (
          <AdminCalendarView key={`cal-${refreshKey}`} />
        )}
        {activeTab === "blackouts" && (
          <BlackoutManager
            key={`blackouts-${refreshKey}`}
            onChanged={triggerRefresh}
          />
        )}
      </main>
    </div>
  );
}
