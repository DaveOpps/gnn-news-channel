"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Article, categoryMeta } from "@/lib/types";
import { Badge, Card, Icon, PageHeader, btnPrimary, btnSecondary, microLabel } from "./ui";

const MAX_TOP = 4;

export default function CurationBoard({
  published,
  initialHeroId,
  initialTopIds,
  isCurated,
}: {
  published: Pick<Article, "id" | "title" | "slug" | "category" | "isFeatured" | "isLiveBlog">[];
  initialHeroId?: string;
  initialTopIds: string[];
  isCurated: boolean;
}) {
  const router = useRouter();
  const [heroId, setHeroId] = useState<string | undefined>(initialHeroId);
  const [topIds, setTopIds] = useState<string[]>(initialTopIds);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const byId = new Map(published.map((a) => [a.id, a]));
  const top = topIds.map((id) => byId.get(id)).filter(Boolean) as typeof published;
  const hero = heroId ? byId.get(heroId) : undefined;

  const available = published.filter((a) => a.id !== heroId && !topIds.includes(a.id));

  function move(from: number, to: number) {
    if (to < 0 || to >= topIds.length) return;
    const next = [...topIds];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setTopIds(next);
  }

  function addTop(id: string) {
    if (topIds.length >= MAX_TOP) return;
    setTopIds([...topIds, id]);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/curation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId, topStoryIds: topIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not save" });
        return;
      }
      setMessage({ ok: true, text: "Front page updated." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm("Reset the homepage to automatic ordering?")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/curation", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not reset" });
        return;
      }
      setHeroId(undefined);
      setTopIds([]);
      setMessage({ ok: true, text: "Back to automatic ordering." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const dot = (cat: string) => (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: categoryMeta(cat).color }}
      aria-hidden
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage"
        subtitle={
          isCurated
            ? "Arranged by hand. Unpublished stories drop out automatically."
            : "Currently automatic — newest and featured stories lead."
        }
        action={
          <div className="flex items-center gap-2">
            <button onClick={reset} disabled={saving} className={btnSecondary}>
              <Icon.Undo className="h-4 w-4" />
              Reset to automatic
            </button>
            <button onClick={save} disabled={saving} className={btnPrimary}>
              {saving ? "Saving…" : "Save front page"}
            </button>
          </div>
        }
      />

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Hero */}
          <Card className="p-5">
            <p className={microLabel}>Hero story</p>
            {hero ? (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
                {dot(hero.category)}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                  {hero.title}
                </span>
                {hero.isLiveBlog && <Badge tone="brand">Live</Badge>}
                <button
                  onClick={() => setHeroId(undefined)}
                  title="Clear hero"
                  className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Icon.Trash className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-sm text-zinc-400">
                Automatic — the newest featured story leads
              </p>
            )}
          </Card>

          {/* Top stories */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className={microLabel}>Top stories rail</p>
              <span className="text-xs tabular-nums text-zinc-400">
                {topIds.length}/{MAX_TOP}
              </span>
            </div>

            {top.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-400">
                Automatic — the next four stories fill this rail
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {top.map((a, i) => (
                  <li
                    key={a.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex cursor-grab items-center gap-3 rounded-lg border bg-white p-3 transition-colors active:cursor-grabbing ${
                      dragIndex === i ? "border-brand" : "border-zinc-200 hover:bg-zinc-50/70"
                    }`}
                  >
                    <span className="w-4 shrink-0 text-center text-xs tabular-nums text-zinc-400">
                      {i + 1}
                    </span>
                    {dot(a.category)}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                      {a.title}
                    </span>
                    {a.isLiveBlog && <Badge tone="brand">Live</Badge>}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => move(i, i - 1)}
                        disabled={i === 0}
                        title="Move up"
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(i, i + 1)}
                        disabled={i === top.length - 1}
                        title="Move down"
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setTopIds(topIds.filter((id) => id !== a.id))}
                        title="Remove from rail"
                        className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Icon.Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-zinc-400">
              Drag to reorder, or use the arrows.
            </p>
          </Card>
        </div>

        {/* Picker */}
        <Card className="sticky top-24 overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">
              Published stories
              <span className="ml-2 text-xs font-normal tabular-nums text-zinc-400">
                {available.length}
              </span>
            </h2>
          </div>
          <ul className="max-h-[28rem] divide-y divide-zinc-100 overflow-y-auto">
            {available.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/70">
                {dot(a.category)}
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                  {a.title}
                </span>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setHeroId(a.id)}
                    title="Make hero"
                    className="rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
                  >
                    Hero
                  </button>
                  <button
                    onClick={() => addTop(a.id)}
                    disabled={topIds.length >= MAX_TOP}
                    title={topIds.length >= MAX_TOP ? "Rail is full" : "Add to top stories"}
                    className="rounded border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40"
                  >
                    Top
                  </button>
                </div>
              </li>
            ))}
            {available.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-zinc-400">
                Every published story is placed.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
