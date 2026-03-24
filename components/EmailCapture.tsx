"use client";

import { useState } from "react";

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Subscription failed");
      }

      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-sm font-mono text-green-400">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
        </svg>
        You&apos;re subscribed — first brief arrives at 6 AM ET tomorrow.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none"
          viewBox="0 0 16 16" fill="currentColor"
        >
          <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 5.616v6.634c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.616L8.35 9.65a.25.25 0 0 1-.7 0Zm13-1.642-6 4.299-6-4.299V3.75a.25.25 0 0 1 .25-.25h11.5a.25.25 0 0 1 .25.25Z"/>
        </svg>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full bg-surface-raised border border-surface-border rounded-md pl-8 pr-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand/50 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="shrink-0 px-4 py-2 rounded-md text-sm font-medium bg-brand text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
      >
        {status === "loading" ? "Subscribing…" : "Get daily brief"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-400 font-mono sm:absolute sm:mt-10">{error}</p>
      )}
    </form>
  );
}
