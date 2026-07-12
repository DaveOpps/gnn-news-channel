"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Video, videoThumb } from "@/lib/types";
import { compact, timeAgo } from "@/lib/format";
import { Card, EmptyState, Icon, PageHeader, btnPrimary, input, microLabel } from "./ui";

const selectClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-shadow focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5";

export default function VideosManager({ initial }: { initial: Video[] }) {
  const [videos, setVideos] = useState<Video[]>(initial);
  const [query, setQuery] = useState("");
  const [show, setShow] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const shows = useMemo(
    () => [...new Set(videos.map((v) => v.show))].sort((a, b) => a.localeCompare(b)),
    [videos]
  );

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (show !== "all" && v.show !== show) return false;
      if (query && !v.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [videos, query, show]);

  async function toggleFeatured(v: Video) {
    setBusy(v.id);
    try {
      const res = await fetch(`/api/videos/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !v.featured }),
      });
      if (res.ok) {
        const updated: Video = await res.json();
        setVideos((prev) => prev.map((x) => (x.id === v.id ? updated : x)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(v: Video) {
    if (!confirm(`Delete "${v.title}"? This can't be undone.`)) return;
    setBusy(v.id);
    try {
      const res = await fetch(`/api/videos/${v.id}`, { method: "DELETE" });
      if (res.ok) setVideos((prev) => prev.filter((x) => x.id !== v.id));
    } finally {
      setBusy(null);
    }
  }

  const th = `px-4 py-3 text-left ${microLabel}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        subtitle={`${filtered.length} of ${videos.length} ${
          videos.length === 1 ? "video" : "videos"
        }`}
        action={
          <Link href="/admin/videos/new" className={btnPrimary}>
            <Icon.Plus className="h-4 w-4" />
            New video
          </Link>
        }
      />

      <Card className="flex flex-wrap gap-3 p-4">
        <div className="relative min-w-56 flex-1">
          <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
            className={`${input} pl-9`}
          />
        </div>
        <select value={show} onChange={(e) => setShow(e.target.value)} className={selectClass}>
          <option value="all">All shows</option>
          {shows.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70">
                <th className={th}>Video</th>
                <th className={th}>Show</th>
                <th className={`${th} text-center`}>Featured</th>
                <th className={`${th} text-right`}>Views</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((v) => {
                const isBusy = busy === v.id;
                const thumb = videoThumb(v);
                return (
                  <tr
                    key={v.id}
                    className={`transition-colors hover:bg-zinc-50/70 ${
                      isBusy ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={v.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[9px] font-bold text-white">
                            {v.duration}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/videos/${v.id}`}
                            className="line-clamp-1 text-sm font-medium text-zinc-900 transition-colors hover:text-brand"
                          >
                            {v.title}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {timeAgo(v.publishedAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-xs text-zinc-600">{v.show}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex justify-center">
                        <button
                          disabled={isBusy}
                          onClick={() => toggleFeatured(v)}
                          title={v.featured ? "Featured — click to unset" : "Mark as featured"}
                          aria-pressed={v.featured}
                          className={`rounded-md p-1.5 text-base leading-none ring-1 ring-inset transition-colors ${
                            v.featured
                              ? "bg-amber-50 text-amber-500 ring-amber-500/20"
                              : "text-zinc-300 ring-transparent hover:bg-zinc-50 hover:text-zinc-500"
                          }`}
                        >
                          <span className="block h-4 w-4 text-[15px] leading-4">★</span>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-zinc-600">
                      {compact(v.views)}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/video/${v.id}`}
                          target="_blank"
                          title="View on site"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Icon.Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/videos/${v.id}`}
                          title="Edit"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Icon.Pen className="h-4 w-4" />
                        </Link>
                        <button
                          disabled={isBusy}
                          onClick={() => remove(v)}
                          title="Delete"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Icon.Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title="No videos match your filters"
            description="Try clearing the search or changing the show."
            icon={<Icon.Image className="h-8 w-8" />}
          />
        )}
      </Card>
    </div>
  );
}
