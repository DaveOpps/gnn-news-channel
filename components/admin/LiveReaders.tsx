"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { card, microLabel } from "./ui";

type Live = { readers: number; stories: { id: string; title: string; readers: number }[] };

/**
 * The dashboard's hero figure. Polls rather than streams — a 10s cadence is
 * well inside the 60s presence window, so the number never flickers to zero.
 */
export default function LiveReaders() {
  const [live, setLive] = useState<Live>({ readers: 0, stories: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/insights/live");
        if (!res.ok) return;
        const data: Live = await res.json();
        if (alive) {
          setLive(data);
          setLoaded(true);
        }
      } catch {
        /* transient */
      }
    };
    poll();
    const timer = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <p className={microLabel}>Reading right now</p>
      </div>

      {/* Hero figure: same sans, proportional figures, not tabular */}
      <p className="mt-3 text-5xl font-semibold leading-none tracking-tight text-zinc-900">
        {loaded ? live.readers : "—"}
      </p>

      {live.stories.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-4">
          {live.stories.map((s) => (
            <li key={s.id} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-zinc-600">
                <Link
                  href={`/admin/articles/${s.id}`}
                  className="transition-colors hover:text-brand"
                >
                  {s.title}
                </Link>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-zinc-400">{s.readers}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-zinc-400">
          {loaded ? "Nobody on a story at the moment." : "Checking…"}
        </p>
      )}
    </div>
  );
}
