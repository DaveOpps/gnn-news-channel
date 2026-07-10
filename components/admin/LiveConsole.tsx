"use client";

import { useState } from "react";
import Link from "next/link";
import { Article, LiveUpdate } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Badge, Card, EmptyState, Icon, btnPrimary, input, microLabel } from "./ui";

export default function LiveConsole({
  article,
  initial,
}: {
  article: Pick<Article, "id" | "title" | "slug" | "isLiveBlog">;
  initial: LiveUpdate[];
}) {
  const [updates, setUpdates] = useState<LiveUpdate[]>(initial);
  const [text, setText] = useState("");
  const [isKey, setIsKey] = useState(false);
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/articles/${article.id}/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, isKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not post the update");
        return;
      }
      setUpdates((prev) => [data as LiveUpdate, ...prev]);
      setText("");
      setIsKey(false);
    } finally {
      setPosting(false);
    }
  }

  async function toggleKey(u: LiveUpdate) {
    setBusy(u.id);
    try {
      const res = await fetch(`/api/live/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isKey: !u.isKey }),
      });
      if (res.ok) {
        const updated: LiveUpdate = await res.json();
        setUpdates((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this live update?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/live/${id}`, { method: "DELETE" });
      if (res.ok) setUpdates((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              Live
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Live console
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{article.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/article/${article.slug}`}
            target="_blank"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            View on site ↗
          </Link>
          <Link
            href={`/admin/articles/${article.id}`}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Back to story
          </Link>
        </div>
      </div>

      {!article.isLiveBlog && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            This story isn&apos;t marked as a live blog, so these updates stay hidden.
            Turn on <strong>Live blog</strong> in the story settings to publish them.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Icon.Alert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Composer */}
      <Card className="p-5">
        <form onSubmit={post} className="space-y-3">
          <label className={microLabel}>Post an update</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
            placeholder="What just happened…"
            className={input}
          />
          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={isKey}
                onChange={(e) => setIsKey(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-[var(--brand)]"
              />
              Mark as a key development
            </label>
            <button type="submit" disabled={posting || !text.trim()} className={btnPrimary}>
              {posting ? "Posting…" : "Post update"}
            </button>
          </div>
        </form>
      </Card>

      {/* Feed */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Feed
            <span className="ml-2 text-xs font-normal tabular-nums text-zinc-400">
              {updates.length}
            </span>
          </h2>
        </div>

        {updates.length === 0 ? (
          <EmptyState
            title="No updates yet"
            description="Post the first update and it appears on the story immediately."
            icon={<Icon.Comments className="h-8 w-8" />}
          />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {updates.map((u) => {
              const isBusy = busy === u.id;
              return (
                <li key={u.id} className={`px-5 py-4 ${isBusy ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-zinc-500">
                          {new Date(u.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-xs text-zinc-400">· {timeAgo(u.createdAt)}</span>
                        {u.isKey && <Badge tone="brand">Key</Badge>}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-800">
                        {u.body}
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">{u.editorName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        disabled={isBusy}
                        onClick={() => toggleKey(u)}
                        title={u.isKey ? "Unmark key development" : "Mark as key development"}
                        className={`rounded-md p-1.5 text-base leading-none ring-1 ring-inset transition-colors ${
                          u.isKey
                            ? "bg-amber-50 text-amber-500 ring-amber-500/20"
                            : "text-zinc-300 ring-transparent hover:bg-zinc-50 hover:text-zinc-500"
                        }`}
                      >
                        <span className="block h-4 w-4 text-[15px] leading-4">★</span>
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => remove(u.id)}
                        title="Delete update"
                        className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Icon.Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
