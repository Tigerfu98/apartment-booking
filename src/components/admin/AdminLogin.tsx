"use client";

import { useState, FormEvent } from "react";

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid password");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-light text-warm-gray-800 text-center mb-8">
          Admin Dashboard
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-warm-gray-200 p-8"
        >
          <label
            htmlFor="password"
            className="block text-sm font-medium text-warm-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-warm-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue transition-colors"
            placeholder="Enter admin password"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 py-2.5 bg-slate-blue text-white text-sm font-medium rounded-lg hover:bg-slate-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
