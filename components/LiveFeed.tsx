"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LiveUpdate } from "@/lib/types";

function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * A live blog reads newest-first, like a wire. The page is server-rendered on
 * every request, so we just ask the router to refresh on a timer.
 */
export default function LiveFeed({ updates }: { updates: LiveUpdate[] }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <section className="mt-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 bg-brand px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live
        </span>
        <h2 className="text-xl font-black uppercase tracking-wide">Latest updates</h2>
        <span className="ml-auto text-xs text-neutral-400">
          Refreshes automatically
        </span>
      </div>

      {updates.length === 0 ? (
        <p className="text-sm text-neutral-500">
          This live blog has started. Updates will appear here as they come in.
        </p>
      ) : (
        <ol className="relative space-y-6 border-l-2 border-neutral-200 pl-6">
          {updates.map((u) => (
            <li key={u.id} className="relative">
              <span
                className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-white ${
                  u.isKey ? "bg-brand" : "bg-neutral-300"
                }`}
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-sm font-black tabular-nums text-neutral-900">
                  {clockTime(u.createdAt)}
                </time>
                <span className="text-xs text-neutral-400">{dayLabel(u.createdAt)}</span>
                {u.isKey && (
                  <span className="bg-brand px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    Key update
                  </span>
                )}
              </div>
              <p
                className={`mt-2 whitespace-pre-line leading-relaxed text-neutral-800 ${
                  u.isKey ? "text-[1.05rem] font-medium" : "text-base"
                }`}
              >
                {u.body}
              </p>
              <p className="mt-1.5 text-xs text-neutral-400">{u.editorName}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
