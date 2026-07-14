"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Resets every story's view count to zero. Destructive and admin-only, so it
 * asks for confirmation first and reports the result inline.
 */
export function ClearViewsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    setError(null);
    setDone(null);

    const ok = window.confirm(
      "Reset ALL view counts to zero?\n\n" +
        "This clears total views and the traffic history for every story. " +
        "It cannot be undone."
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch("/api/analytics/reset-views", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to reset views");
      } else {
        setDone(`Cleared views on ${data.reset} stories`);
        router.refresh();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 border-t border-zinc-100 pt-3">
      <button
        type="button"
        onClick={reset}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-brand disabled:opacity-50"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        {busy ? "Resetting…" : "Reset views"}
      </button>
      {done && <p className="mt-1.5 text-[11px] font-medium text-emerald-600">{done}</p>}
      {error && <p className="mt-1.5 text-[11px] font-medium text-brand">{error}</p>}
    </div>
  );
}
