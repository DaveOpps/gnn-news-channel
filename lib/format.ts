/**
 * Pure formatting helpers. Deliberately *not* in a "use client" module — the
 * server components call these directly, and a client-module export would
 * cross the boundary and throw at render time.
 */

/** 0 → "0", 1200 → "1.2K", 3_400_000 → "3.4M" */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** Seconds → "2m 05s" */
export function mmss(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}
